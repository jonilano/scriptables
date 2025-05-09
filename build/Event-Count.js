// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: green; icon-glyph: magic;
//Shoutout to riverwolf for sharing the code to fetch remaining events for the day. https://talk.automators.fm/t/calendar-reminders/9236

var widget = new ListWidget();
const NOW = new Date();

// Find today's events that are part of the calendar list
// Change this to your calendars
const VISIBLE_CALENDARS = [
    "Work",
    "Home",
];

// const reminderCalendars = await Calendar.forReminders();
// reminderCalendars.forEach(calendar => {
//     console.log(`Reminder Calendar Name: ${calendar.title}`);
// });

const itemsToShow = [];
const events = await CalendarEvent.today();
for (const event of events) {
    if (event.endDate.getTime() > NOW.getTime() && VISIBLE_CALENDARS.includes(event.calendar.title)) {
        itemsToShow.push({
            id: event.identifier,
        });
    }
}

let calsymbol = SFSymbol.named("calendar");

var imagestack = widget.addStack();
imagestack.setPadding(5, 5, 5, 5);
imagestack.addSpacer();
let calimage = imagestack.addImage(calsymbol.image);
calimage.resizable = false;
calimage.tintColor = Color.white();
calimage.centerAlignImage();
imagestack.addSpacer();

var counterstack = widget.addStack();
counterstack.setPadding(5, 5, 5, 5);
counterstack.addSpacer();
counterstack.addText(String(itemsToShow.length)).font =
    Font.boldSystemFont(25);
counterstack.addSpacer();

widget.url = "calshow://";

if (config.runsInApp) widget.presentMedium();
else if (config.runsInWidget) Script.setWidget(widget);
