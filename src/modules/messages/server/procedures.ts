import { z } from "zod"
import prisma from "@/lib/db"
import { inngest } from "@/inngest/client"
import { createTRPCRouter, protectedProcedure } from "@/trpc/init"
import { TRPCError } from "@trpc/server"
import { consumeCredits } from "@/lib/usage"

export const messagesRouter = createTRPCRouter({
  getMany: protectedProcedure
    .input(
      z.object({
        projectId: z.string().min(1, { message: "Project ID is required" }),
      })
    )
    .query(async ({ input, ctx }) => {
      const messages = await prisma.message.findMany({
        where: {
          projectId: input.projectId,
          project: { userId: ctx.auth.userId },
        },
        orderBy: { updatedAt: "asc" },
        include: { fragment: true },
      })
      return messages
    }),

  create: protectedProcedure
    .input(
      z.object({
        value: z
          .string()
          .min(1, { message: "Message cannot be empty" })
          .max(5000, { message: "Message cannot be longer than 5000 characters" }),
        projectId: z.string().min(1, { message: "Project ID is required" }),
        model: z.enum(["deepseek", "kimi"]).default("kimi"),
        // File upload: base64 encoded file content + metadata
        fileData: z
          .object({
            name: z.string(),
            content: z.string(), // base64 encoded
            mimeType: z.string(),
            size: z.number(),
          })
          .optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const existingProject = await prisma.project.findUnique({
        where: { id: input.projectId, userId: ctx.auth.userId },
      })
      if (!existingProject) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" })
      }

      try {
        await consumeCredits()
      } catch (error) {
        if (error instanceof Error) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Something went wrong" })
        } else {
          throw new TRPCError({
            code: "TOO_MANY_REQUESTS",
            message: "You have reached your limit of requests",
          })
        }
      }

      // Build message content — append file info so agent knows about it
      let messageContent = input.value
      if (input.fileData) {
        messageContent += `\n\n[FILE UPLOADED: ${input.fileData.name} (${(input.fileData.size / 1024).toFixed(1)} KB)]` 
      }

      const createdMessage = await prisma.message.create({
        data: {
          projectId: input.projectId,
          content: messageContent,
          role: "USER",
          type: "RESULT",
        },
      })

      await inngest.send({
        name: "code-agent/run",
        data: {
          value: messageContent,
          projectId: input.projectId,
          model: input.model,
          fileData: input.fileData ?? null,
        },
      })

      return createdMessage
    }),
})

export type MessagesRouter = typeof messagesRouter
