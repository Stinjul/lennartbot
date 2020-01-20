console.log("Starting bot...");

const Eris = require("eris");
const config = require("./config.json");

// Helpers

function getIdFromMention(mention) {
    const id = mention.match(/^<[@,#][!,&]?(\d+)>$/);

    // return if no matches
    if (!id) return;

    //matches[0] contains full match, [1] is what we want to capture aka the first capture group
    return id[1]
};

// Bot functions

var bot = new Eris.CommandClient(config.token, {}, {
    prefix: config.prefix
});

bot.on("ready", () => {
    console.log("Bot has logged in succesfully");
});

bot.registerCommand("removeallwithout", (msg, args) => {
    const guild = msg.member.guild

    // check arguments
    if (args.length !== 1) {
        return `Invalid number of args (1 required, ${args.length} given)`
    };

    const role = guild.roles.filter(r => r.id == getIdFromMention(args[0]))[0];

    // Check if role was found
    if (!role) {
        return `First argument "${args[0]}" is not a valid role mention`
    };

    // Workaround for https://github.com/abalabahaha/eris/issues/627
    if (!msg.channel.permissionsOf(msg.author.id).has("kickMembers")) {
        return "You do not have the required permissions to use this command!";
    }


    const membersToPurge = guild.members.filter(m => !m.roles.includes(role.id) && !m.user.bot);
    var kickPromises = [];

    membersToPurge.forEach(m => kickPromises.push(m.kick()
        .then(() => {
            console.log(`Kicked ${m.user.username} (id: ${m.user.id})`);
            m.isPurged = true;
        })
        .catch(err => {
            console.error(`Could not kick ${m.user.username} (id: ${m.user.id}) because of error {${err}}`);
            m.isPurged = false;
        })
    ));

    return Promise.all(kickPromises).then(() => {
        var responeMessage = `Purged ${membersToPurge.filter(m => m.isPurged).length} user(s) without role ${role.name}`;
        responeMessage += membersToPurge.some(m => !m.isPurged) ? `, but the following ${membersToPurge.filter(m => !m.isPurged).length} user(s) could not be purged because of errors (check the console): ${membersToPurge.filter(m => !m.isPurged).map(m => m.user.username).join(', ')}`: '';
        return responeMessage
    })

}, {
    description: "Purges users that do not have role",
    fullDescription: "Remove all users that do !NOT! have the mentioned role",
    usage: "<@role>",
    permissionMessage: "You do not have the required permissions to use this command!",
    requirements: {
        permissions: {
            "kickMembers" : true
        }
    }
});

bot.connect();
