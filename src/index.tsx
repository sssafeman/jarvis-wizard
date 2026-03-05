#!/usr/bin/env node
import React from "react";
import { Command } from "commander";
import { render } from "ink";
import { App } from "./app.js";

const program = new Command();

program
  .name("jarvis-wizard")
  .description("Jarvis Setup Wizard")
  .version("0.1.0")
  .action(() => {
    render(<App />);
  });

program.parse(process.argv);
