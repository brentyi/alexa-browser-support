/* eslint-disable  func-names */
/* eslint quote-props: ["error", "consistent"]*/
'use strict';

const Alexa = require('alexa-sdk');
const caniuse = require('caniuse-api');
const APP_ID = 'amzn1.ask.skill.abd9c55e-f9aa-48e4-89ac-8dc265efc55a';

const languageStrings = {
    'en': {
        translation: {
            SKILL_NAME: 'Browser Support',
            WELCOME_MESSAGE: 'Hello! Welcome to %s. You can make requests such as, summarize browser support for websockets',
            WELCOME_REPROMT: 'For instructions on what you can say, please say help me.',
            HELP_MESSAGE: 'You can make requests such as, summarize browser support for websockets',
            HELP_REPROMT: "You can say things like, summarize browser support for websockets, or you can say exit...Now, what can I help you with?",
            NOT_FOUND: 'Sorry, I don\'t have any data on %s',
            STOP_MESSAGE: 'Goodbye!'
        },
    }
};

const handlers = {
    'LaunchRequest': function () {
        this.attributes.speechOutput = this.t('WELCOME_MESSAGE', this.t('SKILL_NAME'));
        // If the user either does not reply to the welcome message or says something that is not
        // understood, they will be prompted again with this text.
        this.attributes.repromptSpeech = this.t('WELCOME_REPROMT');
        this.emit(':ask', this.attributes.speechOutput, this.attributes.repromptSpeech);
    },
    'SupportSummary': function () {
        if (this.event.request.dialogState == "STARTED" || this.event.request.dialogState == "IN_PROGRESS"){
            this.context.succeed({
                "response": {
                    "directives": [
                        {
                            "type": "Dialog.Delegate"
                        }
                    ],
                    "shouldEndSession": false
                },
                "sessionAttributes": {}
            });
        } else {
            const featureSlot = this.event.request.intent.slots.feature;
            if (featureSlot && featureSlot.value) {

                function permute(value) {
                    var output = [];
                    var delimeters = ["", "-"];

                    let i = value.indexOf(" ");
                    if (i == -1) {
                        output.push(value);
                    } else {
                        for (var j = 0; j < delimeters.length; j++) {
                            let delimeter = delimeters[j];
                            //console.log(value.slice(0, i) + delimeter + value.slice(i + 1));
                            output = output.concat(permute(value.slice(0, i) + delimeter + value.slice(i + 1)));
                        }
                    }
                    return output;
                }

                let input = featureSlot.value.toLowerCase();
                let permutations = permute(input);
                let feature = undefined;
                for (let x = 0; (feature == undefined || (Array.isArray(feature) && feature[0] == undefined)) && x < permutations.length; x++) {
                    feature = caniuse.find(permutations[x]);
                }

                if (Array.isArray(feature)) {
                    feature = feature[0];
                }
                if (!feature) {
                    this.emit(':tell', this.t('NOT_FOUND', input));
                    return;
                }

                let support = caniuse.getSupport(feature, true);
                let words = feature + " is supported in: ";
                for (var browser in support) {
                    if ("y" in support[browser]) {
                        if (browser == "edge" || browser == "firefox" || browser == "chrome") {
                            words += browser + " since version " + support[browser]["y"] + ". ";
                        } else if (browser == "ie") {
                            words += "Internet Explorer" + " since version " + support[browser]["y"] + ". ";
                        }
                    }
                }
                this.emit(':tell', words);
            }
        }
    },
    'AMAZON.HelpIntent': function () {
        this.attributes.speechOutput = this.t('HELP_MESSAGE');
        this.attributes.repromptSpeech = this.t('HELP_REPROMT');
        this.emit(':ask', this.attributes.speechOutput, this.attributes.repromptSpeech);
    },
    'AMAZON.RepeatIntent': function () {
        this.emit(':ask', this.attributes.speechOutput, this.attributes.repromptSpeech);
    },
    'AMAZON.StopIntent': function () {
        this.emit('SessionEndedRequest');
    },
    'AMAZON.CancelIntent': function () {
        this.emit('SessionEndedRequest');
    },
    'SessionEndedRequest': function () {
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
    'Unhandled': function () {
        this.attributes.speechOutput = this.t('HELP_MESSAGE');
        this.attributes.repromptSpeech = this.t('HELP_REPROMPT');
        this.emit(':ask', this.attributes.speechOutput, this.attributes.repromptSpeech);
    },
};

exports.handler = function (event, context) {
    const alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    // To enable string internationalization (i18n) features, set a resources object.
    alexa.resources = languageStrings;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

