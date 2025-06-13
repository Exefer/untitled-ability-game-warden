import type { RobloxUserResult } from "@/lib/roblox-api";

export type UnionKeys<T> = T extends any ? keyof T : never;

export type ExtractByKey<T, K extends UnionKeys<T>> = T extends Record<K, any> ? T : never;

export type RobloxUser = ExtractByKey<RobloxUserResult, "id">;

export type InputAnswers = { answerA: unknown; answerB: unknown; answerC: unknown };

export enum PreconditionIdentifier {
  AdminOnly = "AdminOnly",
}
