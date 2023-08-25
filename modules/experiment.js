import {ynode, shuffle, comprehension_set} from 'https://cdn.jsdelivr.net/gh/FranckPrts/four-in-a-row-MaLab/modules/utils.js';
import {get_puzzle_board, get_puzzle_tree} from 'https://cdn.jsdelivr.net/gh/FranckPrts/four-in-a-row-MaLab/modules/forced_win_boards.js';

export var config					 = {};
export var points					 = 0;
export var numberOfTrial 			 = 30;
export var bonus					 = 0;
export var level					 = 50;
export var free_play_tutorial_try    = 0;
export var puzzles_tutorial_try      = 0;
export var allTrialResults           = [];

// setters function
export function set_numberOfTrial(NumberOfTrial){
    numberOfTrial = NumberOfTrial
}

// getters function
export function get_level(){
    return level
}

export function get_points(){
    return points
}

export function get_bonus(){
    return bonus
}

export var ineligible = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: "",
    choices: [" "],
    on_load: () => {
        let exitMessage = '<h3>Unfortunately, you do not qualify for this study.</h3>';        
        exitMessage += '<h3><br><br>We are sorry for the inconvenience! You can close this browser window now.</h3>';
        jsPsych.endExperiment(exitMessage);
    },
}

export var browser_wrong = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: "",
    choices: [" "],
    on_load: () => {
        let exitMessage = '<h3>You must use Google Chrome for this experiment.</h3>';        
        exitMessage += '<h3><br><br>We are sorry for the inconvenience! You may open this window in Chrome and continue if you wish.</h3>';
        jsPsych.endExperiment(exitMessage);
    },
}

/**
 * Uploads data to Firebase
 * 
 * @param {Number} id the user id
 * @param {object} data the data to be uploaded (in JSON Object form)
 */
export function uploadData(id, category, game_index, data){
    config.set(config.ref(config.database, id+"/"+category+"/"+game_index), data).then(() => {
        // Data saved successfully!
    }).catch((error) => {
        alert("Saving data failed")
    });
}

export async function readData(id, category, game_index){
    let data = null;
    const dbRef = config.ref(config.database);
    await config.get(config.child(dbRef, id+"/"+category+"/"+game_index)).then((snapshot) => {
        if (snapshot.exists()) {
            data = snapshot.val();
        }
        }).catch((error) => {
        console.error(error);
    });
    return data
}

export function save_puzzle_data(){
    let data = jsPsych.data.getLastTrialData().trials[0]
    if (data.submit_mode){
        let existing_data = readData(config.id, "puzzles", data.game_index)
        existing_data.then((result) => {
            if (result != null){
                result.push(data.solution)
            } else {
                result = [data.solution]
            }
            uploadData(config.id, "puzzles", data.game_index, result)
        })
    } else {
        if (data.result == 'win'){
            if (data.length == 2){
                points += 100;
                bonus += 0.25;
            } else if (data.length == 3){
                points += 200;
                bonus += 1;
            } else if (data.length == 4){
                points += 300;
                bonus += 2;
            }
        }
        let result = {
            solution: data.solution,
            length: data.length,
            first_move_RT: data.first_move_RT,
            all_move_RT: data.all_move_RT,
            all_move_times: data.all_move_times,
            mouse_movements: data.mouse_movements,
            duration: data.duration,
            player_color: data.player_color,
            result: data.result,
            puzzle: data.puzzle,
            //initial_delay: data.initial_delay
        };
        uploadData(config.id, "puzzles", data.game_index, result)
    }
}

// export function save_free_play_data(){  					// THIS IS THE ORIGNIAL FUNCTION
    
// 	let data = jsPsych.data.getLastTrialData().trials[0]

//     if (data.result == 'win'){
//         points += 100;
//         bonus += 0.2;
//         level = Math.min(199, level + 10);
//     } else if (data.result == 'tie'){
//         points += 50;
//         bonus += 0.1;
//         level = Math.max(0, level - 10);
//     } else {
//         level = Math.max(0, level - 10);
//     }
//     // let result = {
//     //     solution: data.solution,
//     //     first_move_RT: data.first_move_RT,
//     //     all_move_RT: data.all_move_RT,
//     //     all_move_times: data.all_move_times,
//     //     mouse_movements: data.mouse_movements,
//     //     duration: data.duration,
//     //     level: data.level,
//     //     player_color: data.player_color,
//     //     result: data.result
//     // };
    
// 	let result_MH = {
//         first_move_RT: data.first_move_RT,
//         all_move_RT: data.all_move_RT,
//         all_move_times: data.all_move_times,
//         duration: data.duration,
//         level: data.level,
//         player_color: data.player_color,
//         result: data.result
//     };
// 	console.log(result_MH)
//     //uploadData(config.id, "free_play", data.game_index, result)

// }

// // Define an array to store trial results


export function save_free_play_data() {
    let data = jsPsych.data.getLastTrialData().trials[0];

	let result_MH = {
        // solution: data.solution,
        FIAR_first_move_RT: data.first_move_RT,
        // all_move_RT: data.all_move_RT,
        // all_move_times: data.all_move_times,
        // mouse_movements: data.mouse_movements,
        FIAR_total_duration: data.duration,
        FIAR_level: data.level,
        // player_color: data.player_color,
        FIAR_result: data.result, // (data.result === 'win') ? 1 : 0,
		FIAR_game_length: data.all_move_RT.length
    };
    // Update trial results array
    allTrialResults.push(result_MH);

    // Perform parameter adjustments based on trial results
    if (data.result == 'win') {
        points += 100;
        bonus += 0.2;
        level = Math.min(199, level + 10);
    } else if (data.result == 'tie') {
        points += 50;
        bonus += 0.1;
        level = Math.max(0, level - 10);
    } else {
        level = Math.max(0, level - 10);
    }
    console.log(allTrialResults);
}

export function calculateAverage(resultsArray) {
    if (resultsArray.length === 0) {
        return null; // Return null if there are no results
    }

    let average = {
        FIAR_first_move_RT		: 0,
        FIAR_total_duration		: 0,
        FIAR_level_average		: 0,
        FIAR_game_length_average		: 0,
        FIAR_level_min			: resultsArray[0].FIAR_level,
        FIAR_level_max			: resultsArray[0].FIAR_level,
        FIAR_number_of_wins		: 0,
		FIAR_number_of_losses	: 0,
		FIAR_number_of_ties		: 0
    };
    
    let resultCounts = {
        win: 0,
        tie: 0,
        loss: 0
    };

    // Sum up the values for each property across all trials
    for (let i = 0; i < resultsArray.length; i++) {
		let trialData = resultsArray[i];
        
        average.FIAR_first_move_RT += trialData.FIAR_first_move_RT;
        average.FIAR_total_duration += trialData.FIAR_total_duration;
        average.FIAR_game_length_average += trialData.FIAR_game_length;
        average.FIAR_level_average += trialData.FIAR_level;
		
        // Update min and max level
        if (trialData.FIAR_level < average.FIAR_level_min) {
			average.FIAR_level_min = trialData.FIAR_level;
        }
        if (trialData.FIAR_level > average.FIAR_level_max) {
			average.FIAR_level_max = trialData.FIAR_level;
        }
		
		console.log(resultsArray);
		// Update result counts
		if (trialData.FIAR_result === 'win') {
			average.FIAR_number_of_wins++;
		} else if (trialData.FIAR_result === 'loss') {
			average.FIAR_number_of_losses++;
		} else if (trialData.FIAR_result === 'tie') {
			average.FIAR_number_of_ties++;
		}
    }

    // Calculate the average by dividing the summed values by the number of trials
    let numTrials = resultsArray.length;
	average.FIAR_first_move_RT /= numTrials;
    average.FIAR_total_duration /= numTrials;
    average.FIAR_level_average /= numTrials;
    average.FIAR_game_length_average /= numTrials;
    
    // for (let result in resultCounts) {
    //     if (resultCounts.hasOwnProperty(result)) {
    //         average.result[result] = resultCounts[result] / numTrials;
    //     }
    // }

    return average;
}


export function save_demographic_data(){
    let data = jsPsych.data.getLastTrialData().trials[0]
    uploadData(config.id, "demographic", 0, data.response)
}

export function save_first_timestamp_data(){
    uploadData(config.id, "time_stamps", "performance_start", performance.now())
    uploadData(config.id, "time_stamps", "date_start", Date.now())
}

export function save_last_timestamp_data(){
    uploadData(config.id, "time_stamps", "performance_end", performance.now())
    uploadData(config.id, "time_stamps", "date_end", Date.now())
    uploadData(config.id, "bonus", "bonus", bonus)
    //uploadData(config.id, "bonus", "points", points)
    //uploadData(config.id, "bonus", "bonus", Math.round(100 * points/(9000/14))/100)
}

export function save_freeplay_instruction_data(){
    let data = jsPsych.data.getLastTrialData().trials[0]
    uploadData(config.id, "instructions", "free_play", data.view_history)
}

export function save_freeplay_practice(){
    let data = jsPsych.data.getLastTrialData().trials[0]
    let result = {
        solution: data.solution,
        first_move_RT: data.first_move_RT,
        all_move_RT: data.all_move_RT,
        all_move_times: data.all_move_times,
        mouse_movements: data.mouse_movements,
        duration: data.duration,
        level: data.level,
        player_color: data.player_color,
        result: data.result
    };
    uploadData(config.id, "practice", "free_play_"+100*free_play_tutorial_try+data.game_index, result)
}

export function save_puzzle_practice(){
    let data = jsPsych.data.getLastTrialData().trials[0]
    let result = {
        solution: data.solution,
        first_move_RT: data.first_move_RT,
        all_move_RT: data.all_move_RT,
        all_move_times: data.all_move_times,
        mouse_movements: data.mouse_movements,
        duration: data.duration,
        player_color: data.player_color,
        result: data.result,
        //initial_delay: data.initial_delay
    };
    uploadData(config.id, "practice", "puzzles_"+100*puzzles_tutorial_try+data.game_index, result)
}

export function save_puzzle_instruction_data(){
    let data = jsPsych.data.getLastTrialData().trials[0]
    uploadData(config.id, "instructions", "puzzles", data.view_history)
}

export async function is_subject_eligible(){
    let existing_data = readData(config.id, "eligible", 0)
    existing_data.then((result) => {
        if (result != null){
            if (result == true){
                return true
            } else{
                return false
            }
        } else {
            return true
        }
    })
}

export function set_subject_ineligible(){
    uploadData(config.id, "eligible", 0, false)
}

/**
 * Main body of the experiment
 * 
 * @param {List} timeline the timeline from jsPsych 
 */
export function create_timeline(timeline){
    var images = [
        'static/free_play_comprehension.png',
        'static/puzzles_comprehension1.png',
        'static/puzzles_comprehension2.png',
        'static/instructions1.png',
        'static/instructions2.png', 
        'static/instructions3.png',
        'static/instructions4.png',
        'static/instructions5.png', 
        'static/instructions6.png', 
        'static/instructions7.png', 
        'static/instructions8.png', 
        'static/instructions9.png'];

    var audio = ['static/correct6.wav', 'static/wrong1.wav'];

    var preload = {
        type: jsPsychPreload,
        images: images,
        audio: audio 
    }

    var enter_fullscreen = {
        message: `
        <h1>Four In A Row</h1>
        <p>
            Welcome to the study! The aim of this study is to learn more about the ways people plan.
            <br/><br/>
            This experiment has sound effects so we encourage you to turn your <b>sound on</b>. <br/><br/>
            The experiment will switch to full screen mode when you press the button below. <br/><br/>
            Please <b>remain in full screen</b> for the rest of the experiment.
        </p>`,
        type: jsPsychFullscreen,
        fullscreen_mode: true,
        on_load: () => {
            save_first_timestamp_data()
        }
    }

    var consent_form = {
        type: jsPsychSurvey,
        pages: [
            [{
                type: 'html',
                prompt: '<p>Please read the consent form and sign by ticking the checkbox.</p>'+
                    '<iframe src="static/consent.pdf#zoom=60" width="100%" height="300px"></iframe>'+
                    '<p style="font-size:10pt; margin:0">' +
                    '<a href="static/consent.pdf" target="_blank" download="static/consent.pdf" style="font-size:10pt; margin:0; color:#b0ccff">' +
                    'Click here to download the pdf for your records.</a></p>',
            }, 
            {
                type: 'multi-choice',
                prompt: "Do you agree to take part in this study?", 
                name: 'agree', 
                options: ['I agree', 'I do not agree'],
                required: true,
            }]
        ],
        title: 'Consent form',
        button_label_finish: 'Submit',
        on_finish: (data) => {
            let agree = data.response.agree;
            if (agree == 'I do not agree') {
                let exitMessage = '<h3>Unfortunately, you do not qualify for this study.</h3>';        
                exitMessage += '<h3><br><br>We are sorry for the inconvenience! You can close this browser window now.</h3>';
                jsPsych.endExperiment(exitMessage);
            }
        },
    };

    var demographic_survey = {
        type: jsPsychSurvey,
        pages: [
          [
            {
              type: 'text',
              prompt: "Enter your age", 
              name: 'age', 
              input_type: 'number',
              required: true,
            }, 
            {
              type: 'multi-choice',
              prompt: "What is your gender?", 
              name: 'gender', 
              options: ['Non-binary', 'Female', 'Male', 'Prefer not to say'],
              required: true,
            }
          ],
          [
            {
              type: 'multi-choice',
              prompt: "Are you of Hispanic, Latino, or of Spanish origin?", 
              options: ['Yes', 'No', 'Prefer not to say'],
              name: 'ethnicity', 
              required: true,
            }, 
            {
              type: 'multi-select',
              prompt: "How would you describe yourself?", 
              options: ['American Indian or Alaskan Native','Asian','Black or African American','Native Hawaiian or Other Pacific Islander', 'White', 'Other', 'Prefer not to say'],
              columns: 1,
              name: 'race', 
              required: true,
            }
          ]
        ],
        title: 'Questionnaire',
        button_label_next: 'Continue',
        button_label_back: 'Previous',
        button_label_finish: 'Submit',
        on_finish: (data) => {
            let age = data.response.age;
            if (age < 18 || age > 100) {
                let exitMessage = '<h3>Unfortunately, you do not qualify for this study.</h3>';        
                exitMessage += '<h3><br><br>We are sorry for the inconvenience! You can close this browser window now.</h3>';
                set_subject_ineligible();
                jsPsych.endExperiment(exitMessage);
            } else {
                save_demographic_data();
            }
        },
    };

    var free_play_instructions = {
        type: jsPsychInstructions,
        pages: [
        // 'You will receive <b>$6</b> for completing the experiment, with a maximum bonus of <b>$14</b> based on performance. <br/><br/>' +
        // 'If you drop out early or end the experiment before it is complete, you will not be paid.',
        `<h1>Welcome!</h1><br/>In this game, you and the computer will place black or white pieces on a game board.<br/><br/>` +
        '<img width="80%" height="auto" src="static/instructions1.png"></img>',
        'If you get 4 pieces in a row, you win!<br/><br/>' +
        '<img width="80%" height="auto" src="static/instructions2.png"></img>',
        'You can connect your 4 pieces in any direction: horizontally, vertically or diagonally.<br/><br/>' +
        '<img width="80%" height="auto" src="static/instructions3.png"></img>',
        'If the computer gets 4-in-a-row before you do, you <b>lose</b>.<br/><br/>',
        'If the board is full and no one has 4-in-a-row, the game is a <b>tie</b>.<br/><br/>' +
        '<img width="80%" height="auto" src="static/instructions4.png"></img>',
        'Black always goes first. You will alternate between playing as black and white <br/><br/>(if you play black in your first game, you will play white in your second game, etc.).',
        // 'The experiment is split into two parts. In the first part, you will be freely playing against a computer ' +
        // 'agent. <br/><br/>' +
        'You will receive a <b>bonus reward</b> for every game you win. <br/><br/>' +//<b>The more points you have, the higher your bonus will be</b>. <br/><br/>' +
        'You will get <b>$0.30 for winning</b> a game, <b>$0.15 for a tie</b> and <b>$0.00 if you lose</b>.',
        'This part consists of 30 games. You will now play two practice games to see how it works.'
        ],
        show_clickable_nav: true,
        on_finish: save_freeplay_instruction_data
    }

    let free_play_tutorial = [];
    free_play_tutorial.push(free_play_instructions);		// add lab.js conditional for instruction here

    free_play_tutorial.push({
        type: jsPsychFourInARow,
        game_index: 1,
        get_level: () => 0,
        on_load: () => {free_play_tutorial_try += 1},
        on_finish: save_freeplay_practice,
        player: 0
    })

    free_play_tutorial.push({
        type: jsPsychFourInARow,
        game_index: 2,
        get_level: () => 0,
        on_finish: save_freeplay_practice,
        player: 1
    })

    var free_play_comprehension = comprehension_set({timeline: [...free_play_tutorial]}, 
        [
            {
                text: "<h3>What is the goal of the game?</h3>", 
                options: [
                    "Place four pieces near to each other in any shape",
                    "Finish the game as fast as possible",
                    "Place four pieces of your color in a line"
                ], 
                desc: "The goal of the game is to place four pieces of your color in a straight line.",
                answer: 2
            },
            {
                text: `<div class="img-container"><img src='static/free_play_comprehension.png' height=300/></div><br/><br/>
                       <h3>Which player has won in this case?</h3>`
                , 
                options: [
                    "Black",
                    "White",
                    "Neither"
                ], 
                desc: "White has 4 pieces in a row and hence won.",
                answer: 1
            },
            {
                text: `<h3>Which player goes first?</h3>`
                , 
                options: [
                    "White",
                    "Black",
                    "Random"
                ], 
                desc: "Black always goes first.",
                answer: 1
            },
            {
                text: `<h3>How much bonus reward do you get if you tie?</h3>`
                , 
                options: [
                    "$0.30",
                    "$0.15",
                    "$0.00"
                ], 
                desc: "You get $0.15 bonus reward for a tie, half of what you get for a win.",
                answer: 0
            },
        ]
    )

    var after_practice = ynode(`
        <p>
            Let's start the full experiment now.
            <br/><br/>
        </p>
    `);

    var puzzles_instructions = {
        type: jsPsychInstructions,
        pages: [
        'You will now start the second part of the experiment.',
        'Instead of starting from an empty board, you will start with pieces already on the board.<br/><br/>' +
        "<img width='80%' height='auto' src='static/instructions5.png'></img>",
        'The text on top will tell you how many moves you are given to get a 4-in-a-row. <br/><br/>Furthermore, it also says what color you are playing. <br/><br/>' +
        "<img width='80%' height='auto' src='static/instructions7.png'></img>",
        'Your job is to find the correct sequence of moves that leads to a 4-in-a-row. <br/>' + 
        "<img width='80%' height='auto' src='static/instructions6.png'></img>",
        "The opponent will make the best possible moves to stop you from getting a 4-in-a-row.<br/>"+
        "You must therefore choose the moves that will <b>FORCE</b> a win within the specified number of moves.",
        'Puzzles requiring more moves will give more <b>bonus reward</b> if solved.<br/><br/>' +
        `<table cellspacing='16vw'>
            <tr>
                <th>Moves</th>
                <th>Bonus Reward</th>
            </tr>
            <tr>
                <td>2</td>
                <td>$0.50</td>
            </tr>
            <tr>
                <td>3</td>
                <td>$1.00</td>
            </tr>
            <tr>
                <td>4</td>
                <td>$2.00</td>
            </tr>
        </table><br/><br/>`,
        'You can take <b>as much time as you want for the first move</b>. <br/><br/>Use this time to <b>plan</b> which moves you will make.',
        //'As soon as the timer bar on the right turns green, you can make your first move. <br/><br/> (You may always choose to wait longer to plan a bit more if you would like.)'+
        //"<img width='30%' height='auto' src='static/instructions_extra.png'></img>",
        'You will have <b>3 seconds </b>to make every move afterwards.<br/><br/>' +
        "<img width='80%' height='auto' src='static/instructions8.png'></img>",
        'If you make a move that does not lead to a 4-in-a-row in the specified number of moves,</br> the trial will end and you will get no bonus reward. <br/><br/>' +
        "<img width='80%' height='auto' src='static/instructions9.png'></img>",
        'There are 30 puzzles in total. As before, we will do two practice rounds first.',
        ],
        show_clickable_nav: true,
        view_duration: 5000,
        allow_keys: false,
        on_finish: save_puzzle_instruction_data
    }

    let puzzles_tutorial = [];
    puzzles_tutorial.push(puzzles_instructions);

    puzzles_tutorial.push({
        type: jsPsychFourInARow,
        pieces: [[12, 13, 14], [11, 4, 22]],
        free_play: false,
        tree: {"root":[15], "15": -1},
        get_level: () =>{0},
        game_index: 1,
        length: 1,
        initial_delay: 0,//5000 + Math.round(5000*Math.random()),
        on_load: () => {puzzles_tutorial_try += 1},
        on_finish: save_puzzle_practice
    })

    puzzles_tutorial.push({
        type: jsPsychFourInARow,
        pieces: get_puzzle_board(0),
        free_play: false,
        tree: get_puzzle_tree(0),
        get_level: () =>{0},
        game_index: 2,
        length: 2,
        initial_delay: 0,//5000 + Math.round(5000*Math.random()),
        on_finish: save_puzzle_practice
    })

    var puzzles_comprehension = comprehension_set({timeline: [...puzzles_tutorial]}, 
        [
            {
                text: "<h3>How many moves can I make in a puzzle?</h3>", 
                options: [
                    "As many as it takes for me to win",
                    "As many as I am told I am given in the text above the board",
                    "One"
                ], 
                desc: "The text above the board tells you how many moves you are given to solve the puzzle.",
                answer: 1
            },
            {
                text: `<div class="img-container"><img src='static/puzzles_comprehension1.png' height=300/></div><br/><br/>
                       <h3>Which color are you playing in this case?</h3>`
                , 
                options: [
                    "Black",
                    "White",
                    "Can't tell"
                ], 
                desc: "It is white's turn as is mentioned in the text above the board.",
                answer: 1
            },
            {
                text: `<div class="img-container"><img src='static/puzzles_comprehension2.png' height=300/></div><br/><br/>
                       <h3>Why did the player fail to solve this puzzle (foced win in 2 moves) in this case?</h3>`
                , 
                options: [
                    "The move they selected did not lead to a solution in 2 moves",
                    "They took too long to make their move",
                    "The opponent got a 4-in-a-row"
                ], 
                desc: "The move they made allows black to stop them from winning in 2 moves.",
                answer: 0
            },
            {
                text: `<h3>How many seconds do you have to make your first move?</h3>`
                , 
                options: [
                    "1",
                    "3",
                    "As many as I want"
                ], 
                desc: "You can take as much time as you want to make the first move.",
                answer: 2
            },
            {
                text: `<h3>How much bonus reward do you get if you complete a 4 move puzzle?</h3>`
                , 
                options: [
                    "$0.50",
                    "$1.00",
                    "$2.00"
                ], 
                desc: "You get $2.00 bonus reward for solving a 4 move puzzle.",
                answer: 2
            },
        ]
    )
    var puzzles_walkthrough = {
        type: jsPsychInstructions,
        pages: [
        'As a final check before the experiment, we will walk you through a slightly harder puzzle. <br/><br/>' +
        'This is a <b>length 4</b> puzzle and you are playing as black. <br/><br/>' +
        "<img width='80%' height='auto' src='static/example1.png'></img>",
        'One possible solution starts as follows:<br/><br/>'+
        "<img width='80%' height='auto' src='static/example2.png'></img>",
        'This move forces white to defend <b>the imminent 4-in-a-row</b>:<br/><br/>'+
        "<img width='80%' height='auto' src='static/example3.png'></img>",
        'This can then be repeated:<br/><br/>'+
        "<img width='80%' height='auto' src='static/example4.png'></img>",
        "Where again white's move is <b>forced</b>:<br/><br/>"+
        "<img width='80%' height='auto' src='static/example5.png'></img>",
        "And now we're in a position to make the <b>final blow</b>:<br/><br/>"+
        "<img width='80%' height='auto' src='static/example6.png'></img>",
        "This move forces white to defend on <b>both sides</b>,<br/>"+
        "but only one piece can be placed:<br/><br/>"+
        "<img width='80%' height='auto' src='static/example7.png'></img>",
        "This double attack allows us to overwhelm the opponent and <b>win in 4 moves</b>:<br/><br/>"+
        "<img width='80%' height='auto' src='static/example8.png'></img>",
        "It is up to you to come up with <b>a plan</b> like this in the upcoming puzzles.<br/><br/>"+
        "Since you have <b>limited time</b> to make moves, </br>"+
        "it is best to <b>plan out what you will do at the start of the puzzle</b>.<br/><br/>",
        ],
        show_clickable_nav: true,
        view_duration: 200,
        allow_keys: false
    }

    var ready_check_puzzle = ynode(`
        <h1>Are you ready to start the next puzzle?</h1>
    `);

    var ready_check_free_play = ynode(`
        <h1>Are you ready to start the next game?</h1>
    `);

    var submit_block = {
        type: jsPsychHtmlKeyboardResponse,//You collected a total of ${get_points()} points and will receive a <b>$${Math.round(100 * get_points()/(9000/14))/100}</b> bonus.
        stimulus: function(){//submissions/complete?cc=CYRJV1WH
            return `<div> 
                        <p>
                            Thank you for taking part in the study!<br/>
                            You collected a total of <b>$${get_bonus()}</b> bonus reward.
                            (this bonus could take a few days to be applied).
                        <p/>
                        <a href='https://app.prolific.co/submissions/complete?cc=CYRJV1WH'> [Click here to be redirected to Prolific] </a>
                        </h2>
                    </div>`
        },
        stimuli: [" "],
        choices: ['none'],
        on_load: function() {
            save_last_timestamp_data();
            //jsPsych.data.displayData();
        }
    }
    
	
	
	
	
	// Preset order
    //let order = [17, 23, 1, 27, 4, 33, 36, 26, 6, 12, 5, 13, 29, 38, 30, 19, 22, 11, 20, 15, 9, 3, 21, 37, 7, 24, 18, 28, 10, 31, 16, 8, 32, 40, 25, 35, 2, 14, 39, 34];
    let order = [17, 23, 1, 27, 4, 26, 6, 12, 5, 13, 29, 30, 19, 22, 11, 20, 15, 9, 3, 21, 7, 24, 18, 28, 10, 16, 8, 25, 2, 14];

    // Add trials to timeline 
    // timeline.push(preload);
    // timeline.push(enter_fullscreen);
    // timeline.push(consent_form);
    // timeline.push(demographic_survey);
    

	//timeline.push(free_play_comprehension);   		// will have to be added


    // timeline.push(after_practice);
    let color = 1;
    for(let i=0; i<numberOfTrial; i++){
        color = (color+1) % 2;
        if (i > 0){
            timeline.push(ready_check_free_play)
        }
        timeline.push({
            type: jsPsychFourInARowFreePlay,
            game_index: i+1,
            get_level: get_level,
            on_finish: save_free_play_data,
            player: color
        })
    }

    
    //timeline.push(preload);
    //timeline.push(puzzles_comprehension);

    // timeline.push(puzzles_walkthrough);
    // timeline.push(after_practice);
    
    // for(let i=0; i<30; i++){
    //     if (i > 0){
    //         timeline.push(ready_check_puzzle)
    //     }
    //     timeline.push({
    //         type: jsPsychFourInARow,
    //         pieces: get_puzzle_board(order[i]),
    //         free_play: false,
    //         initial_delay: 0,//10000 + Math.round(20000*Math.random()),
    //         tree: get_puzzle_tree(order[i]),
    //         get_level: () =>{0},
    //         game_index: i+1,
    //         length: Math.floor((order[i]-1)/10) + 2,
    //         puzzle: order[i],
    //         on_finish: save_puzzle_data
    //     })
    // }
    // timeline.push(submit_block);
}
