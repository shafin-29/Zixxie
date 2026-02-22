import { z } from "zod";
import prisma from "@/lib/db";
import { inngest } from "@/inngest/client";
import { 
  createTRPCRouter, 
  protectedProcedure } from "@/trpc/init";
import { generateSlug } from "random-word-slugs";
import { TRPCError } from "@trpc/server";
import { consumeCredits } from "@/lib/usage";

export const projectsRouter = createTRPCRouter({
  getOne: protectedProcedure
    .input(
      z.object({
        id: z.string().min(1, {message: "Project ID is required"}),
      }),
    )
    .query(async({ input, ctx }) => {
      
      const exsitingProject = await prisma.project.findUnique({
        where: {
          id: input.id,
          userId: ctx.auth.userId,
        },
      });

      if (!exsitingProject) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }
      
      return exsitingProject;
    }),

  getMany: protectedProcedure
    .query(async ({ ctx }) => {
      const projects = await prisma.project.findMany({
        where: {
          userId: ctx.auth.userId,
        },
        orderBy: {
          updatedAt: "desc",
        },
      });
      
      return projects;
    }),
  create: protectedProcedure
    .input(
      z.object({
        value: z.string()
          .min(1, "Prompt cannot be empty")
          .max(5000, "Prompt cannot be longer than 5000 characters"),
        model: z.string(),
        fileData: z
          .object({
            name: z.string(),
            content: z.string(),
            mimeType: z.string(),
            size: z.number(),
          })
          .optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {

      try {
        await consumeCredits();
      } catch (error) {
        if (error instanceof Error && error.message === "Unauthorized") {
          throw new TRPCError({ code: "UNAUTHORIZED", message: "Please sign in to continue" });
        }
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "You have reached your usage limit" });
      }

      // Derive a human-readable project name from the user's prompt so it
      // reflects what the project is actually about instead of a random slug.
      const firstLineOrSentence = input.value
        .split(/[\n.?!]/)[0]
        .trim();

      // Limit length to keep names concise in the UI.
      const trimmedTitle =
        firstLineOrSentence.length > 80
          ? firstLineOrSentence.slice(0, 77).trimEnd() + "..."
          : firstLineOrSentence;

      const fallbackName = generateSlug(2, { format: "kebab" });
      const projectName = trimmedTitle || fallbackName;

      const createdProject = await prisma.project.create({
        data: {
          userId: ctx.auth.userId,
          name: projectName,
          messages: {
            create: {
              content: input.fileData
                ? `${input.value}\n\n[FILE UPLOADED: ${input.fileData.name} (${(input.fileData.size / 1024).toFixed(1)} KB)]` 
                : input.value,
              role: "USER",
              type: "RESULT",
            }
          }
        }
      })

      const messageValue = input.fileData
        ? `${input.value}\n\n[FILE UPLOADED: ${input.fileData.name} (${(input.fileData.size / 1024).toFixed(1)} KB)]` 
        : input.value

      await inngest.send({
        name: "code-agent/run",
        data: {
          value: messageValue,
          projectId: createdProject.id,
          model: input.model,
          fileData: input.fileData ?? null,
        },
      });

      return createdProject;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().min(1, "Project ID is required") }))
    .mutation(async ({ input, ctx }) => {
      const project = await prisma.project.findFirst({
        where: { id: input.id, userId: ctx.auth.userId },
      });
      if (!project) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }
      await prisma.project.delete({
        where: { id: input.id },
      });
      return { ok: true };
    }),
});
