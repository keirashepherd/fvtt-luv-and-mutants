import {SimpleActorSheet} from "./actor-sheet.js";
import {SimpleItemSheet} from "./item-sheet.js";
import * as documents from "./document-classes.js";

/* -------------------------------------------- */
/*  Foundry VTT Initialization                  */
/* -------------------------------------------- */
Hooks.once("init", async function() {
  console.log(`Initializing Lasers & Feelings System`);

  game.settings.register("lam", "Name", {
    name: "SIMPLE.Name",
    hint: "SIMPLE.Name",
    scope: "world",
    type: String,
    default: true,
    config: true
  });

  CONFIG.Combat.initiative = {
    formula: "1d20",
    decimals: 2
  };

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("lam", SimpleActorSheet, {makeDefault: true});
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("lam", SimpleItemSheet, {makeDefault: true});

  // Register system settings
  game.settings.register("lam", "macroShorthand", {
    name: "SETTINGS.SimpleMacroShorthandN",
    hint: "SETTINGS.SimpleMacroShorthandL",
    scope: "world",
    type: Boolean,
    default: true,
    config: true
  });

  // Register initiative setting.
  game.settings.register("lam", "initFormula", {
    name: "SETTINGS.SimpleInitFormulaN",
    hint: "SETTINGS.SimpleInitFormulaL",
    scope: "world",
    type: String,
    default: "1d20",
    config: true,
    onChange: formula => _simpleUpdateInit(formula, true)
  });

  // Retrieve and assign the initiative formula setting.
  const initFormula = game.settings.get("lam", "initFormula");
  _simpleUpdateInit(initFormula);

  CONFIG.Actor.documentClass = documents.ActorLAF;
  CONFIG.Item.documentClass = documents.ItemLAF;
  CONFIG.Actor.dataModels.character = documents.ActorSystemLAF;
  CONFIG.Item.dataModels.item = documents.ItemSystemLAF;

  /**
   * Update the initiative formula.
   * @param {string} formula - Dice formula to evaluate.
   * @param {boolean} notify - Whether or not to post nofications.
   */
  function _simpleUpdateInit(formula, notify = false) {
    // If the formula is valid, use it.
    try {
      new Roll(formula).roll();
      CONFIG.Combat.initiative.formula = formula;
      if (notify) {
        ui.notifications.notify(game.i18n.localize("SIMPLE.NotifyInitFormulaUpdated") + ` ${formula}`);
      }
    }
    // Otherwise, fall back to a d20.
    catch (error) {
      CONFIG.Combat.initiative.formula = "1d20";
      if (notify) {
        ui.notifications.error(game.i18n.localize("SIMPLE.NotifyInitFormulaInvalid") + ` ${formula}`);
      }
    }
  }

  loadTemplates([
    "systems/lam/templates/item-sheet-attributes.hbs"
  ]);

  CONFIG.LAF ??= {};
  CONFIG.LAF.generateSpaceAdventure = generateSpaceAdventure;
});

async function generateSpaceAdventure() {
  const uuids = [
    "Compendium.lam.create-a-space-adventure.RollTable.oqBx79uTWQAJYktY",
    "Compendium.lam.create-a-space-adventure.RollTable.b185BWE94RfeJfrd",
    "Compendium.lam.create-a-space-adventure.RollTable.whstJAvSM4tfPLFH",
    "Compendium.lam.create-a-space-adventure.RollTable.WNUaoXqv98X7wFz6"
  ];

  const tables = await Promise.all(uuids.map(uuid => fromUuid(uuid)));
  const draws = await Promise.all(tables.map(table => table.draw({displayChat: false})));
  const [threat, wants, target, result] = draws.map(draw => draw.results[0].getChatText());

  return ChatMessage.implementation.create({
    content: game.i18n.format("SIMPLE.SpaceAdventure", {threat, wants, target, result}),
    whisper: [game.user.id],
    speaker: ChatMessage.implementation.getSpeaker()
  });
}
