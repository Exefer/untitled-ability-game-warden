import { SapphireClient } from "@sapphire/framework";
import { GatewayIntentBits } from "discord.js";
import { token } from "./config";

const client = new SapphireClient({
  intents: [GatewayIntentBits.MessageContent, GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

client.login(token);
