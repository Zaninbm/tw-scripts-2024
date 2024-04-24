function variableNameKey(name) {
    return game_data.player.name + '.' + name;
}

function getStringVariableFromLocalStorage(name, defaultValue) {
    return localStorage.getItem(variableNameKey(name)) || defaultValue;
}

function getIntVariableFromLocalStorage(name, defaultValue) {
    var result = parseInt(localStorage.getItem(variableNameKey('reloadIntervalInSecs')), 10);
    if (isNaN(result)) {
        result = defaultValue;
    }
    return result;
}

function getBoolVariableFromLocalStorage(name, defaultValue) {
    var waitForOrderBuildings = localStorage.getItem(variableNameKey(name));
    if (waitForOrderBuildings === null) {
        waitForOrderBuildings = defaultValue; // Default if the key is not found
    } else {
        waitForOrderBuildings = waitForOrderBuildings === 'true'; // Convert string to boolean
    }
    return waitForOrderBuildings;
}

const PRESELECTED_KEYS = [
    variableNameKey('activationKey'),
    variableNameKey('discordWebHookUrl'),
    variableNameKey('discordUnderAttackWebHookUrl'),
    variableNameKey('reloadIntervalInSecs'),
    variableNameKey('waitForOrderBuildings'),
    variableNameKey('botEnabled'),
    //variableNameKey('fullStorageThresholdPercent')
];
PRESELECTED_KEYS.forEach(value => console.log(value + ': ' + localStorage.getItem(value)))

var activationKey = getStringVariableFromLocalStorage('activationKey') || '';
//var discordWebHookUrl = 'https://discord.com/api/webhooks/1218172450710356008/j5uBUYArnFnCJzryewRUGWPv4ie673g7UGc1MLw0Qmy1RMECztihanSFjCnd6b5S8D7i';
var discordWebHookUrl = getStringVariableFromLocalStorage('discordWebHookUrl', 'https://discord.com/api/webhooks/1218172450710356008/j5uBUYArnFnCJzryewRUGWPv4ie673g7UGc1MLw0Qmy1RMECztihanSFjCnd6b5S8D7i');
var discordUnderAttackWebHookUrl = getStringVariableFromLocalStorage('discordUnderAttackWebHookUrl', 'https://discord.com/api/webhooks/1232598569949593700/4mu-_o5BGG-IhVFv-_YHgoEgtntBlVjd6Zz00iJuyOVbn4QmNkOI3TxWV1xuWwsrVOBX');
var reloadIntervalInSecs = getIntVariableFromLocalStorage('reloadIntervalInSecs', 120);
var waitForOrderBuildings = getBoolVariableFromLocalStorage('waitForOrderBuildings', false);
var fullStorageThresholdPercent = getIntVariableFromLocalStorage('fullStorageThresholdPercent', 80);
var botEnabled = getBoolVariableFromLocalStorage('botEnabled', true);

// Values are going to be set later
var captchaDetected = false;
var popGettingFull = false;
var storageGettingFull = false;

// Define an array with navigation rules, including functions to run
const navigationRules = [
    {
        current: "main",
        next: "barracks",
        action: main,
        goNextVillage: false
    },
    {
        current: "barracks",
        next: "iron",
        action: barracks,
        goNextVillage: false
    },
    {
        current: "iron",
        next: "place&mode=scavenge",
        action: quests,
        goNextVillage: false
    },
    {
        current: "place",
        next: "main",
        action: scavenge,
        goNextVillage: true // Switch to next village while going to 'next'
    }
];

botConfigurationUI();
console.log(decrypt(activationKey, getdecky()));
if (!keyIsValid()) {
    //return;
}
runBot();

// Function to check the current screen and perform actions + redirection
function runBot() {

    captcha();
    handleIncomings();
    resources();
    setInterval(resources, 1900);
    finishQuest();
    setInterval(claimRewards, 2000);

    if (!botEnabled) {
        return;
    }

    /*        if (game_data.player.name.includes('Saddled4620')) {
                return;
            }*/

    // Extract the value of 'screen' query parameter from the current URL
    const urlParams = new URLSearchParams(window.location.search);
    const currentScreen = urlParams.get('screen');

    // Find the matching rule for the current screen
    const matchingRule = navigationRules.find(rule => rule.current === currentScreen);

    if (matchingRule) {
        // If a matching rule is found, run the associated action
        matchingRule.action();

        let reloadCountdownInterval = setInterval(() => {
            let link = matchingRule.goNextVillage ? getNextVillageLink(game_data.link_base_pure) : game_data.link_base_pure;
            let href = `${link}${matchingRule.next}`;
            console.log(reloadIntervalInSecs + ' seconds until redirect to: ' + href);
            reloadIntervalInSecs--;
            if (reloadIntervalInSecs < 0 && !captchaDetected) {
                clearInterval(reloadCountdownInterval);
                location.href = href;
            }
        }, 1000);

    }
}

function getNextVillageLink(url) {
    // Use a regular expression to find "village=" followed by one or more digits
    // and replace it by adding an 'n' right before the digits
    // '/game.php?village=2549&screen=' to '/game.php?village=n2549&screen='
    // link with 'n' before village id works like "switch to next village from that id"
    return url.replace(/(village=)(\d+)/, '$1n$2');
}

function finishQuest() {
    setInterval(() => {
        const confirmButton = document.querySelector('.btn.btn-confirm-yes.status-btn.quest-complete-btn');
        if (confirmButton) {
            confirmButton.click();
        }
    }, 2000);
}

function scavenge() {

    // Function to find and click the unlock button, then proceed after a delay
    function findAndClickUnlockButton() {
        const unlockButton = document.querySelector('.btn.btn-default.unlock-button');
        if (!unlockButton) {
            console.log('Unlock button not found');
            return;
        }
        unlockButton.click();

        // Proceed to the next step after 3 seconds
        setTimeout(findAndInteractWithDialog, 1000);
    }

// Function to find the dialog and click the button inside it after a delay
    function findAndInteractWithDialog() {
        const dialog = document.querySelector('.scavenge-option-unlock-dialog');
        if (!dialog) {
            console.log('Dialog not found');
            return;
        }

        const dialogButton = dialog.querySelector('.btn.btn-default');
        if (!dialogButton) {
            console.log('Dialog button not found');
            return;
        }

        // Wait for 2 seconds before clicking the button
        setTimeout(() => {
            dialogButton.click();
            console.log('Dialog button clicked');
        }, 1000);
    }

    findAndClickUnlockButton();

    function scavengeItself() {
        simulateEscKeyPress();
        // Step 1: Run the provided JavaScript code
        (window.TwCheese && TwCheese.tryUseTool('ASS')) || $.ajax('https://cheesasaurus.github.io/twcheese/launch/ASS.js?' + ~~((new Date()) / 3e5), {
            cache: 1,
            dataType: "script"
        });
        void 0;

        // Step 2: Wait for 10 seconds with a countdown
        let countdown = 10;
        let countdownInterval = setInterval(() => {
            console.log(countdown + ' seconds remaining...');
            countdown--;
            if (countdown < 0) {
                clearInterval(countdownInterval);

                // Step 3: Find and click the buttons
                let buttons = document.querySelectorAll('.btn.btn-default.free_send_button');
                let clickIndex = buttons.length - 1; // Start from the last button

                let clickInterval = setInterval(() => {
                    if (clickIndex < 0) {
                        clearInterval(clickInterval);

                        // Step 4: Wait 5 minutes before reloading
                        let reloadCountdown = 5 * 60; // 5 minutes
                        let reloadCountdownInterval = setInterval(() => {
                            //console.log(reloadIntervalInSecs + ' seconds until reload...');
                            reloadCountdown--;
                            if (reloadCountdown < 0) {
                                clearInterval(reloadCountdownInterval);
                                console.log('Reloading page...');
                                window.location.reload();
                            }
                        }, 1000);

                        return; // Exit the function
                    }

                    // Click the current button and decrement the index
                    buttons[clickIndex].click();
                    clickIndex--;
                }, 1000); // Wait 1 second between clicks
            }
        }, 1000); // 10-second countdown with logs
    }

    //scavengeItself();
    setTimeout(() => {
        findAndClickUnlockButton();
        setTimeout(scavengeItself, 8500);
    }, 1000);
}

function quests() {
// Open quests dialog
    const newQuestDiv = document.getElementById('new_quest');
    if (newQuestDiv) {
        console.log('Found #new_quest div.');
        newQuestDiv.click();
        console.log('Clicked on #new_quest div.');
    } else {
        console.log('#new_quest div not found.');
    }

    function clickQuestComplete() {
        const confirmButton = document.querySelector('.btn.btn-confirm-yes.status-btn.quest-complete-btn');
        if (confirmButton) {
            confirmButton.click();
            console.log('Button (.btn.btn-confirm-yes.status-btn.quest-complete-btn) clicked after 1 second.');
            //console.log(confirmButton);
            //debugger;
            setTimeout(window.location.reload, 1000);
        } else {
            console.log('Button (.btn.btn-confirm-yes.status-btn.quest-complete-btn) not found.');
        }
    }

    function handleResourceRewards() {
        setTimeout(() => {
            // Find element with id reward-system-badge and click on it
            const rewardSystemBadge = document.getElementById('reward-system-badge');
            if (rewardSystemBadge) {
                console.log('Clicked on reward system badge.');
                rewardSystemBadge.click();
            }

            // Wait for 3 seconds
            setTimeout(() => {
                const claimButtons = document.querySelectorAll('.btn.btn-confirm-yes.reward-system-claim-button');
                if (claimButtons.length > 0) {
                    claimButtons.forEach((btn, index) => {
                        // Calculate delay based on index to ensure sequential delays
                        // 500ms delay for each button
                        setTimeout(() => {
                            if (typeof storageGettingFull === 'undefined' || storageGettingFull === null || !storageGettingFull) {
                                btn.click();
                                console.log(index);
                                setTimeout(() => window.location.reload(), claimButtons.length * 1000);

                            }
                        }, index * 1000);
                    });
                }

                // Find the element with class 'popup_box_close'
                const closeButton = document.querySelector('.popup_box_close');

                // Check if the element was found
                if (closeButton) {
                    // Use setTimeout to delay the click action by 1 second (1000 milliseconds)
                    setTimeout(() => {
                        closeButton.click();
                        console.log('Clicked on the popup_box_close button');
                    }, (claimButtons.length + 2) * 1000);
                } else {
                    console.log('Popup close button not found.');
                }


            }, 1000);
        }, 1000)
    }

    setTimeout(() => {
        clickQuestComplete();

        setTimeout(() => {

                // Find all elements with class 'questline-header' and without class 'header-opened'
                const questlineHeaders = document.querySelectorAll('.questline-header:not(.header-opened)');

                if (questlineHeaders.length === 0) {
                    console.log('No questline headers found or all questline headers are already opened.');
                }

                let headerIndex = 0;
                const processQuestlineHeaders = () => {
                    if (headerIndex < questlineHeaders.length) {
                        const header = questlineHeaders[headerIndex];
                        console.log('Clicking on questline header...');
                        header.click();

                        setTimeout(() => {
                            const finishedQuests = document.querySelectorAll('.quest-state-finished');
                            console.log(`Found ${finishedQuests.length} finished quest(s) under the current questline header.`);
                            clickQuestComplete();
                            let questIndex = 0;
                            const processFinishedQuests = () => {
                                if (questIndex < finishedQuests.length) {
                                    const quest = finishedQuests[questIndex];
                                    const questLink = quest.querySelector('.quest-link');
                                    if (questLink) {
                                        console.log('Clicking on quest-link within quest-state-finished...');
                                        questLink.click();

                                        setTimeout(() => {
                                            clickQuestComplete();
                                            questIndex++;
                                            processFinishedQuests();
                                        }, 1000);
                                    } else {
                                        console.log('No quest-link found within quest-state-finished.');
                                        questIndex++;
                                        processFinishedQuests();
                                    }
                                } else {
                                    headerIndex++;
                                    processQuestlineHeaders();
                                }
                            };

                            processFinishedQuests();
                        }, 1000);
                    } else {
                        console.log('All questline headers processed.');
                    }
                };
                processQuestlineHeaders();
            },
            1000);
        setTimeout(handleResourceRewards, 8000);
    }, 1000);
}

function barracks() {
    function recruit() {
        console.log('Starting to process the form...');

        function activeQueue() {
            try {
                // Select all elements with the classes 'btn btn-cancel'
                const allButtons = document.querySelectorAll('.btn.btn-cancel');

                // Filter these elements to find ones that contain 'BuildingMain.cancel' in their onClick attribute
                const filteredButtons = Array.from(allButtons).filter(button =>
                    button.getAttribute('onclick') && button.getAttribute('onclick').includes('TrainOverview.cancelOrder'));

                // Return the count of filtered elements
                return filteredButtons.length;
            } catch (error) {
                // In case of any error, return 0
                console.error('Error occurred:', error);
                return 0;
            }
        }

        let activeQueue1 = activeQueue();
        console.log("Recruit queue: " + activeQueue1);
        if (activeQueue1 < 4) {
            // Step 1: Target the form by its ID
            const form = document.getElementById('train_form');
            if (!form) {
                console.log('Form with ID "train_form" not found.');
                return; // Exit if the form isn't found
            }
            console.log('Form found:', form);

// Step 2: Find the input with ID 'spear_0' within the form
            const input = form.querySelector('#spear_0');
            if (input) {
                console.log('Input found within the form:', input);
            } else {
                console.log('Input with ID "spear_0" not found within the form.');
                return; // Exit if the input isn't found
            }

// Step 3: Attempting to find the span with numbers 'xxx/xxxx' within the form
            let targetSpan = null;
            const spans = form.querySelectorAll('td');
            for (const span of spans) {
                const match = span.textContent.match(/\d+\/(\d+)/);
                if (match) {
                    targetSpan = span;
                    console.log('Found target span with numbers within the form:', targetSpan.textContent);
                    break;
                }
            }

            if (targetSpan) {
                // Extract the number after the slash
                const numberAfterSlash = parseInt(targetSpan.textContent.match(/\d+\/(\d+)/)[1], 10);
                console.log('Number after slash:', numberAfterSlash);

                // Step 4: Check if the number is less than 1000
                if (numberAfterSlash < 1200) {
                    console.log('Number is less than 1000, proceeding to input insertion and button click.');

                    // Insert '1' into the input
                    input.value = '1';
                    console.log('Inserted 1 into the input.');

                    // Step 5: Find and click the element with classes 'btn btn-recruit' within the form
                    const recruitButton = form.querySelector('.btn.btn-recruit');
                    if (recruitButton) {
                        //setTimeout(window.location.reload, 1000);
                        recruitButton.click();
                        console.log('Clicked on the recruit button within the form.');
                    } else {
                        console.log('Recruit button with specified classes not found within the form.');
                    }
                } else {
                    console.log('Number is 1000 or more. No action taken.');
                }
            } else {
                console.log('Span with the specified format not found within the form.');
            }
        }
    }

    setInterval(recruit, 5000);
}

function main() {
    const HEADQUARTERS_VIEW = "HEADQUARTERS_VIEW";

    (function () {
        'use strict';
        console.log("-- Tribal Wars script enabled --");
        quests();
        executeBuilding();
    })();

    function activeQueue() {
        try {
            // Select all elements with the classes 'btn btn-cancel'
            const allButtons = document.querySelectorAll('.btn.btn-cancel');

            // Filter these elements to find ones that contain 'BuildingMain.cancel' in their onClick attribute
            const filteredButtons = Array.from(allButtons).filter(button =>
                button.getAttribute('onclick') && button.getAttribute('onclick').includes('BuildingMain.cancel'));

            // Return the count of filtered elements
            return filteredButtons.length;
        } catch (error) {
            // In case of any error, return 0
            console.error('Error occurred:', error);
            return 0;
        }
    }

    function executeBuilding() {
        let currentView = getCurrentView();
        console.log(currentView);
        if (currentView == HEADQUARTERS_VIEW) {
            setInterval(function () {
                buildNextBuilding();
            }, 5000);
        }
    }

    function getCurrentView() {
        let currentUrl = window.location.href;
        if (currentUrl.includes('screen=main')) {
            return HEADQUARTERS_VIEW;
        }
    }

    function buildNextBuilding() {
        let buildQueue = activeQueue();
        console.log("buildQueue " + buildQueue);
        if (buildQueue < 5) {
            let nextBuildingElement = getNextBuildingElement();
            if (nextBuildingElement !== undefined) {
                nextBuildingElement.click();
                console.log("Clicked on " + nextBuildingElement);
                setTimeout(window.location.reload, 1000);
            }
        }
    }

    function getNextBuildingElement() {
        let buildableBuildings = document.getElementsByClassName("btn btn-build");
        let buildingElementsQueue = getBuildingElementsQueueFiltered();
        let found;
        while (found === undefined && buildingElementsQueue.length > 0) {
            var next = buildingElementsQueue.shift();
            if (buildableBuildings.hasOwnProperty(next)) {
                let nextBuilding = document.getElementById(next);
                var isVisible = nextBuilding.offsetWidth > 0 || nextBuilding.offsetHeight > 0;
                if (isVisible) {
                    found = nextBuilding;
                }
                if (waitForOrderBuildings) {
                    break;
                }
            }
        }
        return found;
    }

    function getBuildingElementsQueueFiltered() {

        // Method to filter queue by a given text
        function filterQueueByText(queue, text) {
            return queue.filter(item => item.includes(text));
        }

        let buildingElementsQueue = getBuildingElementsQueue();
        if (typeof storageGettingFull !== 'undefined' && storageGettingFull !== null && storageGettingFull) {
            return filterQueueByText(buildingElementsQueue, "storage");
        }

        if (typeof popGettingFull !== 'undefined' && popGettingFull !== null && popGettingFull) {
            return filterQueueByText(buildingElementsQueue, "farm");
        }

        return buildingElementsQueue;
    }

    function getBuildingElementsQueue() {
        // https://forum.tribalwars.us/index.php?threads/start-up-guide-by-purple-predator.224/
        var queue = [];

        queue.push("main_buildlink_wood_1");

        queue.push("main_buildlink_stone_1");
        queue.push("main_buildlink_iron_1");

        queue.push("main_buildlink_wood_2");
        queue.push("main_buildlink_stone_2");

        queue.push("main_buildlink_main_2");

        queue.push("main_buildlink_wood_3");
        queue.push("main_buildlink_stone_3");

        queue.push("main_buildlink_main_3");

        queue.push("main_buildlink_barracks_1");
        queue.push("main_buildlink_barracks_2");
        queue.push("main_buildlink_barracks_3");

        queue.push("main_buildlink_farm_2");
        queue.push("main_buildlink_storage_2");

        queue.push("main_buildlink_market_1");

        queue.push("main_buildlink_storage_3");

        queue.push("main_buildlink_hide_1");
        queue.push("main_buildlink_hide_2");

        queue.push("main_buildlink_farm_3");

        queue.push("main_buildlink_iron_2");
        queue.push("main_buildlink_iron_3");

        queue.push("main_buildlink_market_2");

        queue.push("main_buildlink_wall_1");
        queue.push("main_buildlink_hide_3");

        queue.push("main_buildlink_wood_4");
        queue.push("main_buildlink_wood_5");
        queue.push("main_buildlink_wood_6");
        queue.push("main_buildlink_wood_7");

        queue.push("main_buildlink_stone_4");
        queue.push("main_buildlink_stone_5");
        queue.push("main_buildlink_wood_8");
        queue.push("main_buildlink_wood_9");
        queue.push("main_buildlink_wood_10");
        queue.push("main_buildlink_stone_6");
        queue.push("main_buildlink_stone_7");
        queue.push("main_buildlink_main_4");
        queue.push("main_buildlink_main_5");
        queue.push("main_buildlink_iron_4");
        queue.push("main_buildlink_iron_5");
        queue.push("main_buildlink_market_3");
        queue.push("main_buildlink_iron_6");
        queue.push("main_buildlink_iron_7");
        queue.push("main_buildlink_storage_3");
        queue.push("main_buildlink_farm_4");
        queue.push("main_buildlink_storage_4");
        queue.push("main_buildlink_barracks_4");
        queue.push("main_buildlink_barracks_5");
        queue.push("main_buildlink_main_6");
        queue.push("main_buildlink_main_7");
        queue.push("main_buildlink_farm_5");
        queue.push("main_buildlink_storage_5");
        queue.push("main_buildlink_main_8");
        queue.push("main_buildlink_main_9");
        queue.push("main_buildlink_main_10");
        queue.push("main_buildlink_farm_6");
        queue.push("main_buildlink_storage_6");

        queue.push("main_buildlink_wood_11");
        queue.push("main_buildlink_wood_12");
        queue.push("main_buildlink_wood_13");

        queue.push("main_buildlink_stone_8");
        queue.push("main_buildlink_stone_9");
        queue.push("main_buildlink_storage_7");
        queue.push("main_buildlink_farm_7");
        queue.push("main_buildlink_market_4");
        queue.push("main_buildlink_market_5");

        queue.push("main_buildlink_barracks_6");
        queue.push("main_buildlink_barracks_7");
        queue.push("main_buildlink_barracks_8");

        queue.push("main_buildlink_wood_14");
        queue.push("main_buildlink_wood_15");
        queue.push("main_buildlink_wood_16");
        queue.push("main_buildlink_wood_17");

        queue.push("main_buildlink_stone_10");
        queue.push("main_buildlink_stone_11");
        queue.push("main_buildlink_storage_8");
        queue.push("main_buildlink_farm_10");

        queue.push("main_buildlink_stone_12");
        queue.push("main_buildlink_stone_13");

        queue.push("main_buildlink_wood_18");
        queue.push("main_buildlink_wood_19");
        queue.push("main_buildlink_wood_20");

        queue.push("main_buildlink_barracks_9");
        queue.push("main_buildlink_barracks_10");

        queue.push("main_buildlink_iron_8");
        queue.push("main_buildlink_iron_9");
        queue.push("main_buildlink_iron_10");

        queue.push("main_buildlink_farm_8");
        queue.push("main_buildlink_farm_9");

        queue.push("main_buildlink_iron_11");
        queue.push("main_buildlink_iron_12");

        queue.push("main_buildlink_stone_14");
        queue.push("main_buildlink_stone_15");

        queue.push("main_buildlink_main_11");
        queue.push("main_buildlink_main_12");
        queue.push("main_buildlink_main_13");
        queue.push("main_buildlink_main_14");
        queue.push("main_buildlink_main_15");

        queue.push("main_buildlink_stone_16");
        queue.push("main_buildlink_stone_17");
        queue.push("main_buildlink_stone_20");

        queue.push("main_buildlink_smith_1");
        queue.push("main_buildlink_smith_2");
        queue.push("main_buildlink_smith_3");
        queue.push("main_buildlink_smith_4");
        queue.push("main_buildlink_smith_5");

        queue.push("main_buildlink_stable_1");
        queue.push("main_buildlink_stable_2");
        queue.push("main_buildlink_stable_3");
        queue.push("main_buildlink_stable_4");
        queue.push("main_buildlink_stable_5");

        queue.push("main_buildlink_iron_13");
        queue.push("main_buildlink_iron_14");
        queue.push("main_buildlink_iron_15");
        queue.push("main_buildlink_iron_16");
        queue.push("main_buildlink_iron_17");
        queue.push("main_buildlink_iron_18");
        queue.push("main_buildlink_iron_19");
        queue.push("main_buildlink_iron_20");

        queue.push("main_buildlink_wood_21");
        queue.push("main_buildlink_stone_21");
        queue.push("main_buildlink_iron_21");

        queue.push("main_buildlink_storage_22");
        queue.push("main_buildlink_storage_23");
        queue.push("main_buildlink_market_11");

        queue.push("main_buildlink_wood_22");
        queue.push("main_buildlink_stone_22");
        queue.push("main_buildlink_iron_22");

        queue.push("main_buildlink_wood_23");
        queue.push("main_buildlink_stone_23");
        queue.push("main_buildlink_iron_23");

        queue.push("main_buildlink_farm_11");
        queue.push("main_buildlink_farm_12");
        queue.push("main_buildlink_farm_13");
        queue.push("main_buildlink_storage_9");


        queue.push("main_buildlink_wall_2");
        queue.push("main_buildlink_wall_3");
        queue.push("main_buildlink_wall_4");

        queue.push("main_buildlink_wall_5");
        queue.push("main_buildlink_storage_10");
        queue.push("main_buildlink_barracks_11");


        queue.push("main_buildlink_barracks_12");
        queue.push("main_buildlink_barracks_13");
        queue.push("main_buildlink_barracks_14");
        queue.push("main_buildlink_barracks_15");
        queue.push("main_buildlink_barracks_16");
        queue.push("main_buildlink_barracks_17");
        queue.push("main_buildlink_barracks_18");
        queue.push("main_buildlink_barracks_19");
        queue.push("main_buildlink_barracks_20");

        queue.push("main_buildlink_wall_6");
        queue.push("main_buildlink_wall_7");
        queue.push("main_buildlink_wall_8");
        queue.push("main_buildlink_wall_9");

        queue.push("main_buildlink_wall_10");
        queue.push("main_buildlink_wall_11");
        queue.push("main_buildlink_wall_12");
        queue.push("main_buildlink_wall_13");
        queue.push("main_buildlink_wall_14");
        queue.push("main_buildlink_wall_15");
        queue.push("main_buildlink_wall_16");
        queue.push("main_buildlink_wall_17");
        queue.push("main_buildlink_wall_18");
        queue.push("main_buildlink_wall_19");
        queue.push("main_buildlink_wall_20");

        queue.push("main_buildlink_stone_16");
        queue.push("main_buildlink_storage_11");
        queue.push("main_buildlink_storage_12");
        queue.push("main_buildlink_storage_13");
        queue.push("main_buildlink_storage_14");
        queue.push("main_buildlink_farm_14");
        queue.push("main_buildlink_farm_15");
        queue.push("main_buildlink_farm_16");
        queue.push("main_buildlink_stone_17");
        queue.push("main_buildlink_storage_15");
        queue.push("main_buildlink_stone_18");
        queue.push("main_buildlink_storage_16");
        /////////
        queue.push("main_buildlink_storage_17");
        queue.push("main_buildlink_storage_18");
        queue.push("main_buildlink_main_16");
        queue.push("main_buildlink_main_17");
        queue.push("main_buildlink_main_18");
        queue.push("main_buildlink_main_19");
        queue.push("main_buildlink_main_20");
        queue.push("main_buildlink_farm_17");
        queue.push("main_buildlink_farm_18");
        queue.push("main_buildlink_farm_19");
        queue.push("main_buildlink_farm_20");
        queue.push("main_buildlink_stone_19");
        queue.push("main_buildlink_stone_20");

        queue.push("main_buildlink_stable_6");
        queue.push("main_buildlink_stable_7");
        queue.push("main_buildlink_stable_8");
        queue.push("main_buildlink_stable_9");
        queue.push("main_buildlink_stable_10");

        queue.push("main_buildlink_storage_19");
        queue.push("main_buildlink_storage_20");
        queue.push("main_buildlink_storage_21");

        queue.push("main_buildlink_market_6");
        queue.push("main_buildlink_market_7");
        queue.push("main_buildlink_market_8");
        queue.push("main_buildlink_market_9");
        queue.push("main_buildlink_market_10");

        queue.push("main_buildlink_storage_24");
        queue.push("main_buildlink_storage_25");
        queue.push("main_buildlink_market_12");

        queue.push("main_buildlink_wood_24");
        queue.push("main_buildlink_stone_24");
        queue.push("main_buildlink_iron_24");
        queue.push("main_buildlink_market_13");

        queue.push("main_buildlink_wood_25");
        queue.push("main_buildlink_stone_25");
        queue.push("main_buildlink_iron_25");
        queue.push("main_buildlink_market_14");

        queue.push("main_buildlink_storage_26");
        queue.push("main_buildlink_storage_27");
        queue.push("main_buildlink_storage_28");
        queue.push("main_buildlink_storage_29");
        queue.push("main_buildlink_storage_30");

        queue.push("main_buildlink_farm_21");
        queue.push("main_buildlink_farm_22");
        queue.push("main_buildlink_farm_23");
        queue.push("main_buildlink_farm_24");
        queue.push("main_buildlink_farm_25");
        queue.push("main_buildlink_farm_26");
        queue.push("main_buildlink_farm_27");
        queue.push("main_buildlink_farm_28");
        queue.push("main_buildlink_farm_29");
        queue.push("main_buildlink_farm_30");

        return queue;
    }

    // Instant build btn click
    function checkAndClickButton() {

        var isFree = false;

        // Select the span element with the data-endtime attribute
        const span = document.querySelector('span[data-endtime]');

        if (span) {
            // Get the time text from the span, assuming format is "HH:MM:SS"
            const timeText = span.textContent; // "0:26:38" in your example

            // Split the timeText into hours, minutes, and seconds
            const parts = timeText.split(':').map(part => parseInt(part, 10)); // Convert each part to an integer

            // Calculate total time in seconds
            const totalTimeInSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];

            // Check if totalTimeInSeconds is less than 2 minutes and 55 seconds (175 seconds)
            if (totalTimeInSeconds < 175) {
                //console.log('The time is less than 2:55 minutes.');
                isFree = true;
            } else {
                //console.log('The time is not less than 2:55 minutes.');
                isFree = false;
            }
        } else {
            //console.log('Span with data-endtime not found.');
        }

        const button = document.querySelector('.order_feature.btn.btn-btr.btn-instant-free');

        if (button && isFree) {
            isFree = false;
            button.click();

            // Assume the click initiates some process that can be awaited or checked
            // Here, you might want to wait for a certain condition to be true
            // For demonstration, we'll use setTimeout as a simple delay mechanism
            setTimeout(() => {
                console.log('Reload after instant free btn click');
                window.location.reload();
                console.log('End of Reload after instant free btn click');
            }, 1000); // Adjust the delay as necessary based on the expected completion time of button actions
        } else {
            console.log('Button not found.');
        }
    }

    // Set an interval to run the function every 5 seconds (5000 milliseconds)
    setInterval(checkAndClickButton, 2000);
}

function claimRewards() {
    //btn btn-confirm-yes reward-system-claim-button
    //const button = document.querySelector('.order_feature.btn.btn-btr.btn-instant-free');
    const claimButtons = document.querySelectorAll('.btn.btn-confirm-yes.reward-system-claim-button');
    if (claimButtons.length > 0) {
        if (typeof storageGettingFull === 'undefined' || storageGettingFull === null || !storageGettingFull) {
            claimButtons[0].click();
        }
    }
}

function captcha() {
    console.log("Captcha detector init");
    var h2Elements = document.getElementsByTagName("h2");
    for (var i = 0; i < h2Elements.length; i++) {
        if (h2Elements[i].textContent === "Zablokovaný požadavek") {
            // Set a timeout to reload the page after 3 seconds
            setTimeout(function () {
                window.location.reload();
            }, 3000);
            break; // Exit the loop once the matching <h2> is found
        }
    }

    function setCookie(name, value, days) {
        var expires = "";
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
            expires = "; expires=" + date.toUTCString();
        }
        // Set the domain attribute to your main domain, prefixed with a dot
        // This makes the cookie accessible across all subdomains of divokekmeny.cz
        document.cookie = name + "=" + (value || "") + expires + "; path=/; domain=.divokekmeny.cz";
    }

    function getCookie(name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for (var i = 0; i < ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0) == ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
        }
        return null;
    }

    if (window.location.href.includes('https://www.divokekmeny.cz/')) {
        /*
                    let remainingTime = 60; // Zbývající čas v sekundách

                    // Najdeme první div s třídami "right" a "login"
                    const targetDiv = document.querySelector('.right.login');

                    // Vytvoříme nový div element s ID "refreshTimer" a textem uvnitř
                    const newDiv = document.createElement('div');
                    newDiv.id = 'refreshTimer';
                    newDiv.class = 'worlds-container';
                    newDiv.innerText = 'Čekání na přesměrování...';

                    // Vložíme nově vytvořený div na začátek nalezeného divu
                    if (targetDiv) {
                        targetDiv.prepend(newDiv);
                    } else {
                        console.log('Cílový div nebyl nalezen.');
                    }

                    var redirectLogin = 'https://www.divokekmeny.cz/page/play/' + getCookie('lastServerCaptcha');

                    // Funkce pro aktualizaci zobrazení zbývajícího času
                    const updateTimerDisplay = () => {
                        document.getElementById('refreshTimer').innerText = `Stránka se přesměruje za ${remainingTime} sekund. ${redirectLogin}`;
                        remainingTime -= 1;
                        if (remainingTime % 10 === 0) {
                            var message = '${remainingTime}s. to login ' + getCookie('lastServerCaptcha');
                            publishNotification(null, message, message);
                        }
                    };

                    // Nastavíme interval pro pravidelnou aktualizaci času
                    const countdownInterval = setInterval(() => {
                        updateTimerDisplay();
                        if (remainingTime <= 0) {
                            clearInterval(countdownInterval); // Zastavíme interval, když dosáhneme 0
                            window.location.href = redirectLogin;
                        }
                    }, 1000); // Aktualizace každou sekundu

                    // Iniciální aktualizace zobrazení
                    updateTimerDisplay();
        */
    } else {

        const server = game_data == null ? null : game_data.world;
        console.log(server);
        const playerName = game_data == null ? null : game_data.player.name
        console.log(playerName);

        function handleCaptcha() {
            //var server = extractSubdomainFromUrl(window.location.href);
            localStorage.setItem('lastServerCaptcha', server);
            setCookie('lastServerCaptcha', server, 7); // Sets the cookie to expire in 7 days
            var message = 'Captcha detected ' + server + ' ' + playerName;
            captchaDetected = true;
            publishNotification(server + ' ' + playerName, message, message);
            setTimeout(function () {
                var message = 'Reloaded ' + window.location.href;
                publishNotification(server + ' ' + playerName, message, message);
                window.location.reload();
            }, 60000); // 60000 milliseconds = 1 minute
        }

        function runScript() {
            // Získání všech elementů <h2> na stránce
            const h2Elements = document.querySelectorAll('h2');
            // Procházení všech <h2> elementů
            h2Elements.forEach((element) => {
                if (element.textContent === 'Ochrana proti Botu. ') {
                    handleCaptcha();
                }
            });
            // Získání všech elementů <div> s třídou "quest"
            const divElements = document.querySelectorAll('div.quest');
            // Procházení všech <div> elementů
            divElements.forEach((element) => {
                const dataTitle = element.getAttribute('data-title');
                if (dataTitle === 'Ochrana proti Botu. ') {
                    handleCaptcha();
                }
            });
        }

        runScript();
        setInterval(runScript, 5000); // Adjust the interval as per your requirement

        if (document.referrer === 'https://www.divokekmeny.cz/') {
            console.log('Referer: ' + document.referrer);

            function readUrls() {
                const urlsJson = localStorage.getItem('urlsList');
                return urlsJson ? JSON.parse(urlsJson) : [];
            }

            function openUrlsInNewWindows() {
                const urls = readUrls(); // Use your existing function to get the URLs
                urls.forEach((url, index) => {
                    // Define window features: width, height, and potentially position (left, top)
                    // Positioning each window slightly offset from the previous one if multiple URLs
                    const windowFeatures = `width=1400,height=1400,left=${100 + index * 300},top=${100 + index * 150}`;
                    window.open(url, `_blank${index}`, windowFeatures);
                    var message = 'Opened ' + url;
                    publishNotification(message, message);
                });
            }

            openUrlsInNewWindows();
        }

        setTimeout(function () {
            window.location.reload();
        }, 21 * 60 * 1000);
    }
}

function resources() {
    const green = "#79ff4d";
    const red = "#ff4d4d";

    // Find spans with id wood, stone, and iron and class "res"
    const woodSpan = document.querySelector("#wood.res");
    const stoneSpan = document.querySelector("#stone.res");
    const ironSpan = document.querySelector("#iron.res");
    // Find span with id storage
    const storageSpan = document.querySelector("#storage");

    var storagePeekPercentage;

    // Check if all elements are found
    if (woodSpan && stoneSpan && ironSpan && storageSpan) {

        const woodAmount = parseInt(woodSpan.textContent);
        const stoneAmount = parseInt(stoneSpan.textContent);
        const ironAmount = parseInt(ironSpan.textContent);
        const storageCapacity = parseInt(storageSpan.textContent);

        const woodPercentage = (woodAmount / storageCapacity) * 100;
        const stonePercentage = (stoneAmount / storageCapacity) * 100;
        const ironPercentage = (ironAmount / storageCapacity) * 100;
        storagePeekPercentage = Math.max(woodPercentage, stonePercentage, ironPercentage, 0);

        // Log the percentages
        //console.log("Wood Percentage:", woodPercentage.toFixed(2) + "%");
        //console.log("Stone Percentage:", stonePercentage.toFixed(2) + "%");
        //console.log("Iron Percentage:", ironPercentage.toFixed(2) + "%");

        if (Math.max(woodPercentage, stonePercentage) > fullStorageThresholdPercent) {
            storageGettingFull = true;
        }

        // Change background color of spans based on the percentage
        function changeBackgroundColor(element, percentage) {
            if (percentage < fullStorageThresholdPercent) {
                element.style.backgroundColor = green;
            } else {
                element.style.backgroundColor = red;
            }
        }

        changeBackgroundColor(woodSpan, woodPercentage);
        changeBackgroundColor(stoneSpan, stonePercentage);
        changeBackgroundColor(ironSpan, ironPercentage);
    }


    var currentSpan = document.getElementById("pop_current_label");
    var maxSpan = document.getElementById("pop_max_label");
    if (currentSpan && maxSpan) {
        var currentPopulation = currentSpan.textContent;

        var maxPopulation = maxSpan.textContent;
        var currentPopulationNum = parseInt(currentPopulation);

        var maxPopulationNum = parseInt(maxPopulation);
        if (!isNaN(currentPopulationNum) && !isNaN(maxPopulationNum) && maxPopulationNum !== 0) {
            var populationPercentage = (currentPopulationNum / maxPopulationNum) * 100; // Log the percentage //console.log("Percentage of population:", percentage + "%"); // Add background color based on percentage
            if (populationPercentage < 90) {
                currentSpan.style.backgroundColor = green;
            } else {
                currentSpan.style.backgroundColor = red;
                popGettingFull = true;
            }
        }
    }

}

function simulateEscKeyPress() {
    // Create a new event
    let event = new KeyboardEvent('keydown', {
        key: "Escape",
        keyCode: 27, // Deprecated, but included for compatibility with older browsers
        code: "Escape",
        which: 27, // Deprecated, but included for compatibility with older browsers
        bubbles: true, // Event will bubble up through the DOM
        cancelable: true // Event can be canceled
    });

    // Dispatch the event on the document
    console.log('ESC');
    document.dispatchEvent(event);
}

function keyIsValid() {
    // Function to compare a given datetime string with the current datetime
    function compareDateTimeWithCurrent(dateTimeString) {
        // Convert the given datetime string to a Date object
        // Get the current datetime as a Date object
        // Compare the two dates
        return new Date(dateTimeString) > new Date();
    }

    return compareDateTimeWithCurrent(decrypt(activationKey, getdecky()));

}

function botConfigurationUI() {
    function localStorageConfig() {
        // Step 1: Define the preselected keys
        // Step 2: Create and insert the modal HTML and CSS
        const modalHTML = `
            <div id="storageManagerModal" style="display: none; position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgb(0,0,0); background-color: rgba(0,0,0,0.4); padding-top: 60px;">
                <div style="background-color: #fefefe; margin: 5% auto; padding: 20px; border: 1px solid #888; width: 80%;">
                    <span class="close" style="color: #aaa; float: right; font-size: 28px; font-weight: bold; cursor: pointer;">&times;</span>
                    <table id="storageTable" style="width:100%;">
                        <thead>
                            <tr>
                                <th>Key</th>
                                <th>Value</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- Rows will be dynamically inserted here -->
                        </tbody>
                    </table>
                </div>
            </div>`;

        // Append the modal HTML to the body
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Step 3: Define functionality to populate the table, update and delete localStorage items
        function populateTable() {
            const tableBody = document.querySelector('#storageTable tbody');
            tableBody.innerHTML = ''; // Clear existing rows
            PRESELECTED_KEYS.forEach(key => {
                const value = localStorage.getItem(key) || '';
                const row = `<tr>
                        <td>${key}</td>
                        <td><input type="text" value="${value}"></td>
                        <td>
                            <button onclick="updateValue('${key}', this)">Save</button>
                            <button onclick="deleteValue('${key}', this)">Delete</button>
                        </td>
                     </tr>`;
                tableBody.insertAdjacentHTML('beforeend', row);
            });
        }

        window.updateValue = function (key, element) {
            const newValue = element.closest('tr').querySelector('input[type=text]').value;
            localStorage.setItem(key, newValue);
            alert('Value updated!');
        };

        window.deleteValue = function (key) {
            localStorage.removeItem(key);
            populateTable(); // Refresh the table
            alert('Value deleted!');
        };

        // Step 4: Display the modal and populate the table
        const modal = document.getElementById('storageManagerModal');
        modal.style.display = 'block';
        populateTable();

        // Step 5: Add functionality to close the modal
        document.querySelector('#storageManagerModal .close').onclick = function () {
            modal.style.display = "none";
        };

        window.onclick = function (event) {
            if (event.target === modal) {
                modal.style.display = "none";
            }
        };
    }

    function quickbar() {
        // Check for the element where the new content will be added
        let quickbarContents = document.getElementById('quickbar_contents');

        // If the element does not exist, create and insert the table structure
        if (!quickbarContents) {
            const newStyleOnlyBreak = document.querySelector('.newStyleOnly');
            if (newStyleOnlyBreak) {
                // Create the table and its nested structure
                const table = document.createElement('table');
                table.setAttribute('align', 'center');
                table.setAttribute('cellspacing', '0');
                table.id = 'quickbar_outer';
                table.width = '100%';

                table.innerHTML = `
                        <tbody>
                            <tr>
                                <td>
                                    <table id="quickbar_inner" style="border-collapse: collapse;" width="100%">
                                        <tbody>
                                            <tr class="topborder">
                                                <td class="left"></td>
                                                <td class="main"></td>
                                                <td class="right"></td>
                                            </tr>
                                            <tr>
                                                <td class="left"></td>
                                                <td class="main" id="quickbar_contents"></td>
                                                <td class="right"></td>
                                            </tr>
                                            <tr class="bottomborder">
                                                <td class="left"></td>
                                                <td class="main"></td>
                                                <td class="right"></td>
                                            </tr>
                                            <tr>
                                                <td class="shadow" colspan="3">
                                                    <div class="leftshadow"></div>
                                                    <div class="rightshadow"></div>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    `;

                // Insert the table after the <br class="newStyleOnly">
                newStyleOnlyBreak.parentNode.insertBefore(table, newStyleOnlyBreak.nextSibling);

                // Update the quickbarContents reference
                quickbarContents = document.getElementById('quickbar_contents');
            } else {
                console.error('Break element with class "newStyleOnly" not found.');
                return; // Exit if the required break element is not present
            }
        }

        // Proceed with the original code to add content to quickbarContents
        const ul = document.createElement('ul');
        ul.className = 'menu nowrap quickbar';


        // Define the array of items to be added
        const items = [
            {
                text: 'TWB configuration',
                action: localStorageConfig
            },
            {
                text: 'TWB Discord test notification',
                action: captchaTestNotification
            }
        ];

        // Function to create each item
        items.forEach(item => {
            const li = document.createElement('li');
            li.className = 'quickbar_item';

            const span = document.createElement('span');

            const a = document.createElement('a');
            a.className = 'quickbar_link';
            a.href = '#';
            if (item.dataHash) {
                a.setAttribute('data-hash', item.dataHash);
            }

            if (item.imgSrc) {
                const img = document.createElement('img');
                img.className = 'quickbar_image';
                img.alt = item.imgAlt;
                img.src = item.imgSrc;
                //img.setAttribute('data-src', item.imgSrc);
                a.appendChild(img);
            }

            a.appendChild(document.createTextNode(item.text));
            span.appendChild(a);
            li.appendChild(span);
            ul.appendChild(li);

            // Add click event listener
            a.addEventListener('click', function (event) {
                event.preventDefault(); // Prevent the default action
                //alert(item.text); // Alert containing the item text
                item.action();
            });
        });

        // Append the <ul> element to quickbar_contents
        quickbarContents.appendChild(ul);
    }

    quickbar();
}

function handleIncomings() {
    console.log("handleIncomings init");

    function checkIncomings() {
        const incomingAmountElement = document.getElementById('incomings_amount');
        if (incomingAmountElement) {
            const currentValue = incomingAmountElement.innerText;
            console.log('Incoming current Value:', currentValue);

            // Step 2: Check if the value has changed using local storage
            const lastValue = localStorage.getItem('lastIncomingsAmount');

            if (lastValue !== null && lastValue !== currentValue) {
                console.log('Incoming value has changed from', lastValue, 'to', currentValue);
                publishUnderAttackNotification(currentValue);
            }

            localStorage.setItem('lastIncomingsAmount', currentValue);
        } else {
            console.log('Element with ID "incomings_amount" not found.');
        }
    }

    setInterval(checkIncomings, 2000);
}


function decrypt(input, key) {

    function toUTF8Array(str) {
        var utf8 = [];
        for (var i = 0; i < str.length; i++) {
            var charcode = str.charCodeAt(i);
            if (charcode < 0x80) utf8.push(charcode);
            else if (charcode < 0x800) {
                utf8.push(0xc0 | (charcode >> 6),
                    0x80 | (charcode & 0x3f));
            } else if (charcode < 0xd800 || charcode >= 0xe000) {
                utf8.push(0xe0 | (charcode >> 12),
                    0x80 | ((charcode >> 6) & 0x3f),
                    0x80 | (charcode & 0x3f));
            } // handle 4-byte characters
            else {
                i++;
                charcode = 0x10000 + (((charcode & 0x3ff) << 10)
                    | (str.charCodeAt(i) & 0x3ff));
                utf8.push(0xf0 | (charcode >> 18),
                    0x80 | ((charcode >> 12) & 0x3f),
                    0x80 | ((charcode >> 6) & 0x3f),
                    0x80 | (charcode & 0x3f));
            }
        }
        return utf8;
    }

    function xorEncryptDecrypt(input, key, isDecrypt = false) {
        let inputBytes = isDecrypt ? atob(input).split('').map(char => char.charCodeAt(0)) : toUTF8Array(input);
        const keyBytes = toUTF8Array(key);
        let outputBytes = [];
        for (let i = 0; i < inputBytes.length; i++) {
            outputBytes.push(inputBytes[i] ^ keyBytes[i % keyBytes.length]);
        }
        let output = String.fromCharCode(...outputBytes);
        return isDecrypt ? output : btoa(output);
    }

    return xorEncryptDecrypt(input, key, true);
}

function publishNotification(username, title, body) {
    const webhookUrl = discordWebHookUrl;
    const data = {
        content: body,
        username: username ? username : 'Captcha detektor' // Optional: Customize the sender's name
    };

    fetch(webhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
        .then((response) => response.text())
        .then((text) => console.log(text))
        .catch((error) => console.error(error));
}

function publishUnderAttackNotification(incomingAttackCount) {
    const webhookUrl = discordUnderAttackWebHookUrl;
    const data = {
        content: game_data.world + ' ' + game_data.player.name + " incoming attacks: " + incomingAttackCount,
        username: game_data.player.name
    };

    fetch(webhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
        .then((response) => response.text())
        .then((text) => console.log(text))
        .catch((error) => console.error(error));
}

function captchaTestNotification() {
    publishNotification(game_data.player.name, 'TWB', 'Tribal Wars Bot notifications works!!!');
}

function getdecky() {
    let name = game_data.player.name
    return 'TWB' + name + name;
}

