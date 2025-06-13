import { UserOrMemberMentionRegex } from "@sapphire/discord.js-utilities";

export function formatRobloxProfileLink(userId: string | number): string {
  return `https://www.roblox.com/users/${userId}/profile`;
}

export function isUserMention(string: string): boolean {
  return UserOrMemberMentionRegex.test(string);
}

export function stripMention(string: string): string {
  if (UserOrMemberMentionRegex.test(string)) {
    return string.match(UserOrMemberMentionRegex)!.groups!.id;
  }
  return string;
}

export function formatDateWithDashes(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}
