var jsPsychHtmlKeyboardResponse = (function (jspsych) {
    'use strict';
  
    const info = {
        name: "html-keyboard-response",
        parameters: {
            /**
             * The HTML string to be displayed.
             */
            stimulus: {
                type: jspsych.ParameterType.HTML_STRING,
                pretty_name: "Stimulus",
                default: undefined,
            },
            /**
             * Array containing the key(s) the subject is allowed to press to respond to the stimulus.
             */
            choices: {
                type: jspsych.ParameterType.KEYS,
                pretty_name: "Choices",
                default: "ALL_KEYS",
            },
            /**
             * Any content here will be displayed below the stimulus.
             */
            prompt: {
                type: jspsych.ParameterType.HTML_STRING,
                pretty_name: "Prompt",
                default: null,
            },
            /**
             * How long to show the stimulus.
             */
            stimulus_duration: {
                type: jspsych.ParameterType.INT,
                pretty_name: "Stimulus duration",
                default: null,
            },
            /**
             * How long to show trial before it ends.
             */
            trial_duration: {
                type: jspsych.ParameterType.INT,
                pretty_name: "Trial duration",
                default: null,
            },
            /**
             * If true, trial will end when subject makes a response.
             */
            response_ends_trial: {
                type: jspsych.ParameterType.BOOL,
                pretty_name: "Response ends trial",
                default: true,
            },
        },
    };
    /**
     * **html-keyboard-response**
     *
     * jsPsych plugin for displaying a stimulus and getting a keyboard response
     *
     * @author Josh de Leeuw
     * @see {@link https://www.jspsych.org/plugins/jspsych-html-keyboard-response/ html-keyboard-response plugin documentation on jspsych.org}
     */
    class HtmlKeyboardResponsePlugin {
        constructor(jsPsych) {
            this.jsPsych = jsPsych;
        }
        trial(display_element, trial) {
            var new_html = '<div id="jspsych-html-keyboard-response-stimulus">' + trial.stimulus + "</div>";
            // add prompt
            if (trial.prompt !== null) {
                new_html += trial.prompt;
            }
            // draw
            display_element.innerHTML = new_html;
            // store response
            var response = {
                rt: null,
                key: null,
            };
            // function to end trial when it is time
            const end_trial = () => {
                // kill any remaining setTimeout handlers
                this.jsPsych.pluginAPI.clearAllTimeouts();
                // kill keyboard listeners
                if (typeof keyboardListener !== "undefined") {
                    this.jsPsych.pluginAPI.cancelKeyboardResponse(keyboardListener);
                }
                // gather the data to store for the trial
                var trial_data = {
                    rt: response.rt,
                    stimulus: trial.stimulus,
                    response: response.key,
                };
                // clear the display
                display_element.innerHTML = "";
                // move on to the next trial
                this.jsPsych.finishTrial(trial_data);
            };
            // function to handle responses by the subject
            var after_response = (info) => {
                // after a valid response, the stimulus will have the CSS class 'responded'
                // which can be used to provide visual feedback that a response was recorded
                display_element.querySelector("#jspsych-html-keyboard-response-stimulus").className +=
                    " responded";
                // only record the first response
                if (response.key == null) {
                    response = info;
                }
                if (trial.response_ends_trial) {
                    end_trial();
                }
            };
            // start the response listener
            if (trial.choices != "NO_KEYS") {
                var keyboardListener = this.jsPsych.pluginAPI.getKeyboardResponse({
                    callback_function: after_response,
                    valid_responses: trial.choices,
                    rt_method: "performance",
                    persist: false,
                    allow_held_key: false,
                });
            }
            // hide stimulus if stimulus_duration is set
            if (trial.stimulus_duration !== null) {
                this.jsPsych.pluginAPI.setTimeout(() => {
                    display_element.querySelector("#jspsych-html-keyboard-response-stimulus").style.visibility = "hidden";
                }, trial.stimulus_duration);
            }
            // end trial if trial_duration is set
            if (trial.trial_duration !== null) {
                this.jsPsych.pluginAPI.setTimeout(end_trial, trial.trial_duration);
            }
        }
        simulate(trial, simulation_mode, simulation_options, load_callback) {
            if (simulation_mode == "data-only") {
                load_callback();
                this.simulate_data_only(trial, simulation_options);
            }
            if (simulation_mode == "visual") {
                this.simulate_visual(trial, simulation_options, load_callback);
            }
        }
        create_simulation_data(trial, simulation_options) {
            const default_data = {
                stimulus: trial.stimulus,
                rt: this.jsPsych.randomization.sampleExGaussian(500, 50, 1 / 150, true),
                response: this.jsPsych.pluginAPI.getValidKey(trial.choices),
            };
            const data = this.jsPsych.pluginAPI.mergeSimulationData(default_data, simulation_options);
            this.jsPsych.pluginAPI.ensureSimulationDataConsistency(trial, data);
            return data;
        }
        simulate_data_only(trial, simulation_options) {
            const data = this.create_simulation_data(trial, simulation_options);
            this.jsPsych.finishTrial(data);
        }
        simulate_visual(trial, simulation_options, load_callback) {
            const data = this.create_simulation_data(trial, simulation_options);
            const display_element = this.jsPsych.getDisplayElement();
            this.trial(display_element, trial);
            load_callback();
            if (data.rt !== null) {
                this.jsPsych.pluginAPI.pressKey(data.response, data.rt);
            }
        }
    }
    HtmlKeyboardResponsePlugin.info = info;
  
    return HtmlKeyboardResponsePlugin;
  
  })(jsPsychModule);
/**
 * Given a string formatted in HTML, creates a timeline node
 * for jsPsych that requires a 'Y' button press to continue
 * 
 * @param {String} html an input formatted in HTML
 * @return {object} a jsPsychHtmlKeyboardResponse node
 */
export function ynode(html){
  return {
    type: jsPsychFullscreen,
    message: html,
    fullscreen_mode: true,
    button_label: "Continue",
    delay_after: 150
  }
}

// export function ynode(html){
//   return {
//     type: jsPsychHtmlKeyboardResponse,
//     stimulus: `
//     <div class="layout">
//     ${html}
//     </div>`
//     ,
//     choices: ["y"]
//   }
// }

export function shuffle(array) {
  let currentIndex = array.length,  randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {

    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}



var accumulator = true

function question(text, options){
    return {
        type: jsPsychHtmlButtonResponse,
        stimulus: `
        <div class="layout comprehension">
            <p>${text}</p>
        </div>
        `,
        choices: options, 
        data:{
            task: 'comprehension',
        },
        button_html: `<div><button class="jspsych-btn">%choice%</button></div>`
    }
}
  
function response(options, correct, description){
    return {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: function(){
            var last_trial = jsPsych.data.getLastTrialData().trials
            var is_correct = last_trial[0].response == correct
            var is_correct_text = `<h2>That was incorrect.</h2><br/>`
        
            if (accumulator){
                accumulator = accumulator && is_correct            
            }

            if (is_correct){
                is_correct_text = `
                <h2>That was correct!</h2><br/>
                <p>${description}
                </p>
                `
            }

            return `<div class="layout comprehension">
            ${is_correct_text}
            <br/><br/>
            <p>Press any key to continue.</p>
            </div>`
        }
    }
}

function intro(){
    return {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: function(){
            //reset the accumulator
            accumulator = true

            return `<div class="layout comprehension">
            <h2>This is a Comprehension Check</h2>
            <p>The following questions will test your comprehension on the 
            instructions. <br/><br/>
            <b>Press any key to continue.</b> </p>
            </div>`
        }
    }
}

function outro(){
    return {
        type: jsPsychHtmlKeyboardResponse,
        stimulus: function(){

            if (accumulator){
                return `<div class="layout comprehension">
                <h2>Wonderful! You have passed the comprehension check.</h2>
                <p>Press any key to continue.</p>
                </div>`
            }
            else{
                return `<div class="layout comprehension">
                <h2>You have not passed the comprehension check.</h2>
                <p>Please read through the informational slides again. 
                Press any key to continue.</p>
                </div>`
            }
        }
    }
}
  
export function comprehension_check(timeline, text, options, correct){
    timeline.push(question(text, options, correct))
    timeline.push(response(options, correct))
}
  
export function comprehension_set(instruction, set){
    var nodes = []
    nodes.push(instruction)

    nodes.push(intro())

    set.map(s =>{
        nodes.push(question(s.text, s.options, s.answer))
        nodes.push(response(s.options, s.answer, s.desc))
    })

    nodes.push(outro())

    return {
        timeline: nodes,
        loop_function: function(){
        if(accumulator){
            return false;
        } else {
            return true;
        }
        }
    }
}