// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-gray; icon-glyph: magic;
//Shoutout to riverwolf for sharing the code to fetch remaining reminders for the day. https://talk.automators.fm/t/calendar-reminders/9236
export {};

const widget = new ListWidget();

const NOW = new Date();
// Find today's reminders
// NOTE: all-day reminders have their time set to 00:00 of the same day, but aren't returned with incompleteDueToday...
const queryStartTime = new Date(NOW);
queryStartTime.setDate(queryStartTime.getDate() - 1);
queryStartTime.setHours(23, 59, 59, 0);
const queryEndTime = new Date(NOW);
queryEndTime.setHours(23, 59, 59, 0);
const todayReminders = await Reminder.incompleteDueBetween(
  queryStartTime,
  queryEndTime
);

// Find overdue reminders
const incompleteReminders = await Reminder.allIncomplete();
const overdueReminders = incompleteReminders.filter((r) => r.isOverdue);

console.log("TODAY REMINDERS:");
console.log(todayReminders);
console.log("OVERDUE REMINDERS:");
console.log(overdueReminders);

// Today reminders + overdue reminders
const todayAndOverdue = todayReminders.concat(overdueReminders);

const remsymbol = SFSymbol.named("list.bullet");

const imagestack = widget.addStack();
imagestack.setPadding(5, 5, 5, 5);
imagestack.addSpacer();
const remimage = imagestack.addImage(remsymbol.image);
remimage.resizable = false;
remimage.tintColor = Color.white();
imagestack.addSpacer();

const counterstack = widget.addStack();
counterstack.setPadding(5, 5, 5, 5);
counterstack.addSpacer();
counterstack.addText(String(todayAndOverdue.length)).font =
  Font.boldSystemFont(25);
counterstack.addSpacer();

widget.url = "x-apple-reminderkit://";

if (config.runsInApp) widget.presentMedium();
else if (config.runsInWidget) Script.setWidget(widget);

Script.complete();
