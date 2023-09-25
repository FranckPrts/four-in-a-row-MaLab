var jsPsychFourInARowFreePlay = (function (jspsych) {
    'use strict';

    const info = {
        name: 'four-in-a-row-freeplay',
        parameters: { 
            game_index: {
                type: jspsych.ParameterType.INT,
                default: -1
            },
            get_level: {
                // Adaptively returns level of opponent for freeplay
                // Since level is a global parameter, this is a function which
                // gets passed down from experiment.js, returning the global variable
                // from there
                type: jspsych.ParameterType.FUNCTION,
            },
            player: {
                // 1 if subject is playing black, 2 if playing white
                type: jspsych.ParameterType.INT,
                default: null
            }
        }
    }
  
    class FourInARowFreePlay {
        constructor(jsPsych){
            this.jsPsych = jsPsych;
            // Canvas sizing
            let w = window.innerWidth * 0.8;
            let h = window.innerHeight * 0.8;
            // Size of a tile
            let s = Math.floor(Math.min(w/9, h/4));
            this.s = s;
            this.w = 9*s;
            this.h = 4*s;
            // Piece radius
            this.r = s * 0.75 / 2;
            // Sampling period for mouse movements
            this.minimumSampleTime = 50;
            // Which color the player is playing ("White" or "Black")
            this.player = null;
            // Keeps track of whose turn it is
            this.turn = null;
            // Keeps track of which pieces are on the board
            this.black_pieces = [];
            this.white_pieces = [];
            // A different way of representing the pieces on the board
            // a 1 is a piece is present, a 0 is no piece is present
            // this is mainly to pass to the opponent for freeplay
            this.bp = new Array(9*4).fill(0);
            this.wp = new Array(9*4).fill(0);
            // For drawing on the canvas
            this.cvs = null;
            this.ctx = null;
            // To turn mouse coordinates to canvas oriented coordinates
            this.rect_left = null;
            this.rect_top = null;
            // Keeps track of all moves being made
            this.current_state = "root";
            // This is where the freeplay opponent will be called from
            this.ai = null;
            // Difficulty level of freeplay opponent (0-199)
            this.level = null;
            // Whether opponent plays black (0) or white (1)
            this.opponent = null;
            // Whether game/puzzle was a 'win', 'tie' or 'loss'
            this.game_result = null;
            // Main HTMl displaying element
            this.display_element = null;
            // To show the 4-in-a-row at the end of a freeplay game
            this.winning_tiles = [];
            // How long in ms it took the subject to make the first move
            this.first_move_RT = null;
            // Whether the subject has made the first move
            this.first_move_made = false;
            // Absolute time stamp of last click (to measure RTs)
            this.last_click_time = null;
            // List of RT for each move
            this.move_RT = [];
            // Absolute time stamps for each move
            this.move_times = [];
            // Sound effects
            this.win_sound = new Audio('static/correct6.wav');
            this.loss_sound = new Audio('static/wrong1.wav');
            // Stores all mouse movements
            this.mouse_movements = [];
        }
        mouseMoveEventHandler = ({ clientX: x, clientY: y }) => {
            const event_time = performance.now();
            const t = Math.round(event_time - this.currentTrialStartTime);
            // Only do stuff every this.minimumSampleTime
            if (event_time - this.lastSampleTime >= this.minimumSampleTime && !this.ready_to_submit) {
                this.lastSampleTime = event_time;
                this.mouse_movements.push([(x - this.rect_left)/this.w, (y - this.rect_top)/this.h, event_time])
                this.draw_board(x - this.rect_left, y - this.rect_top)
            }
        };
        make_move(piece){
            // Only make move is piece not already on the board
            if (!this.black_pieces.includes(piece) && !this.white_pieces.includes(piece)){
                if (this.turn == "Black"){
                    this.black_pieces.push(piece);
                    this.bp[piece] = 1;
                    this.turn = "White";
                } else if (this.turn == "White"){
                    this.white_pieces.push(piece);
                    this.wp[piece] = 1;
                    this.turn = "Black";
                }
                // Records move
                if (this.current_state == "root"){
                    this.current_state = piece.toString();
                } else {
                    this.current_state += "-" + piece.toString();
                }
            }
        };
        opponent_move(){
            if (this.level < 200 && this.level >= 0 && (this.opponent == 0 || this.opponent == 1)){
                // This has to be in a Timeout because the opponent program
                // might take a second to run, so instead of doing a complicated
                // asynch 'await' for the promise to return, we just force a small waiting time.
                setTimeout(()=>{
                    // If board is full, its a tie
                    if (this.black_pieces.length + this.white_pieces.length == 9*4){
                        this.game_result = "tie";
                        this.draw_board(null, null);
                        this.cvs.removeEventListener("mousemove", this.mouseMoveEventHandler);
                        this.cvs.removeEventListener("mousedown", this.mouseDownEventHandler);
                        setTimeout(()=>{
                            this.end_trial();
                        },2000);
                    } else {
                        // Quert opponent for a move
                        this.make_move(this.ai(Date.now(), this.bp.join(""), this.wp.join(""), this.opponent, this.level));
                        // Check if opponent has won, which makes this trial a loss
                        if (this.check_win(this.opponent).length > 0){
                            this.loss_sound.play();
                            this.game_result = "loss";
                            this.winning_tiles = this.check_win(this.opponent);
                            this.draw_board(null, null);
                            this.cvs.removeEventListener("mousemove", this.mouseMoveEventHandler);
                            this.cvs.removeEventListener("mousedown", this.mouseDownEventHandler);
                            setTimeout(()=>{
                                this.end_trial();
                            },3000);
                        // This may seem redundant but it checks for a tie *after* the opponent
                        // has moved.
                        } else if (this.black_pieces.length + this.white_pieces.length == 9*4){
                            this.game_result = "tie";
                            this.draw_board(null, null);
                            this.cvs.removeEventListener("mousemove", this.mouseMoveEventHandler);
                            this.cvs.removeEventListener("mousedown", this.mouseDownEventHandler);
                            setTimeout(()=>{
                                this.end_trial();
                            },2000);
                        }
                    }
                    this.draw_board(null, null);
                }, 100);
            }
        };
        mouseDownEventHandler = ({ clientX: click_x, clientY: click_y }) => {
            const event_time = performance.now();
            const t = Math.round(event_time - this.currentTrialStartTime);
            let x = Math.floor((click_x - this.rect_left) / this.s);
            let y = Math.floor((click_y - this.rect_top) / this.s);
            let piece = y*9 + x;
            if (!this.white_pieces.includes(piece) && !this.black_pieces.includes(piece)){
                if (!this.first_move_made){
                    this.first_move_RT = performance.now() - this.currentTrialStartTime;
                    this.first_move_made = true;
                }
                this.move_RT.push(performance.now() - this.last_click_time);
                this.move_times.push(performance.now());
                this.last_click_time = performance.now();
                this.make_move(piece);
                this.draw_board(click_x - this.rect_left, click_y - this.rect_top);
                if (this.check_win((this.opponent+1)%2).length > 0){
                    this.game_result = "win";
                    this.win_sound.play();
                    this.winning_tiles = this.check_win((this.opponent+1)%2);
                    this.draw_board(null, null);
                    this.cvs.removeEventListener("mousemove", this.mouseMoveEventHandler);
                    this.cvs.removeEventListener("mousedown", this.mouseDownEventHandler);
                    setTimeout(()=>{
                        this.end_trial();
                    },1000);
                } else {
                    this.opponent_move();
                }
                this.draw_board(click_x - this.rect_left, click_y - this.rect_top);
            }
        };
        check_win(color){
            let fourinarows = [[ 0,  9, 18, 27],
                           [ 1, 10, 19, 28],
                           [ 2, 11, 20, 29],
                           [ 3, 12, 21, 30],
                           [ 4, 13, 22, 31],
                           [ 5, 14, 23, 32],
                           [ 6, 15, 24, 33],
                           [ 7, 16, 25, 34],
                           [ 8, 17, 26, 35],
                           [ 0, 10, 20, 30],
                           [ 1, 11, 21, 31],
                           [ 2, 12, 22, 32],
                           [ 3, 13, 23, 33],
                           [ 4, 14, 24, 34],
                           [ 5, 15, 25, 35],
                           [ 3, 11, 19, 27],
                           [ 4, 12, 20, 28],
                           [ 5, 13, 21, 29],
                           [ 6, 14, 22, 30],
                           [ 7, 15, 23, 31],
                           [ 8, 16, 24, 32],
                           [ 0,  1,  2,  3],
                           [ 1,  2,  3,  4],
                           [ 2,  3,  4,  5],
                           [ 3,  4,  5,  6],
                           [ 4,  5,  6,  7],
                           [ 5,  6,  7,  8],
                           [ 9, 10, 11, 12],
                           [10, 11, 12, 13],
                           [11, 12, 13, 14],
                           [12, 13, 14, 15],
                           [13, 14, 15, 16],
                           [14, 15, 16, 17],
                           [18, 19, 20, 21],
                           [19, 20, 21, 22],
                           [20, 21, 22, 23],
                           [21, 22, 23, 24],
                           [22, 23, 24, 25],
                           [23, 24, 25, 26],
                           [27, 28, 29, 30],
                           [28, 29, 30, 31],
                           [29, 30, 31, 32],
                           [30, 31, 32, 33],
                           [31, 32, 33, 34],
                           [32, 33, 34, 35]]
            for(var i=0;i<fourinarows.length;i++){
                var n = 0;
                for(var j=0;j<4;j++){
                    if(color==0)//BLACK
                        n+=this.bp[fourinarows[i][j]]
                    else
                        n+=this.wp[fourinarows[i][j]]
                }
                if(n==4){
                    return fourinarows[i]
                }
            }
            return []
        }
        draw_board(move_x, move_y){
            this.update_top();
            // Clear screen
            this.ctx.clearRect(0, 0, this.w, this.h);
            // Draw hover highlight
            if (move_x !== null && move_y !== null){
                this.ctx.beginPath();
                let x = Math.floor(move_x / this.s) * this.s;
                let y = Math.floor(move_y / this.s) * this.s;
                this.ctx.rect(x, y, this.s, this.s);
                this.ctx.fillStyle = "#bbbbbb";
                this.ctx.fill();
            }
            // Draw border
            this.ctx.beginPath();
            this.ctx.rect(0, 0, this.w, this.h);
            this.ctx.lineWidth = "8";
            this.ctx.strokeStyle = "black";
            this.ctx.stroke();
            this.ctx.lineWidth = "4";
            // Draw grid
            for(let i=1; i<4; i++){
                this.ctx.beginPath();
                this.ctx.moveTo(0, this.h*i/4);
                this.ctx.lineTo(this.w, this.h*i/4);
                this.ctx.stroke();
            }
            for(let i=1; i<9; i++){
                this.ctx.beginPath();
                this.ctx.moveTo(this.w*i/9, 0);
                this.ctx.lineTo(this.w*i/9, this.h);
                this.ctx.stroke();
            }
            for(const piece of this.black_pieces){
                this.ctx.beginPath();
                let x = piece % 9;
                let y = Math.floor(piece / 9);
                this.ctx.arc((this.s * x) + this.s/2, (this.s * y) + this.s/2, this.r, 0, 2 * Math.PI);
                if (this.game_result == "win" && this.player ==  "Black" && this.winning_tiles.includes(piece)){
                    this.ctx.fillStyle = "#22ddaa";
                } else if (this.game_result == "loss" && this.player ==  "White" && this.winning_tiles.includes(piece)){
                    this.ctx.fillStyle = "red";
                } else{
                    this.ctx.fillStyle="black";
                }
                this.ctx.fill();
            }
            for(const piece of this.white_pieces){
                this.ctx.beginPath();
                let x = piece % 9;
                let y = Math.floor(piece / 9);
                this.ctx.arc((this.s * x) + this.s/2, (this.s * y) + this.s/2, this.r, 0, 2 * Math.PI);
                if (this.game_result == "win" && this.player ==  "White" && this.winning_tiles.includes(piece)){
                    this.ctx.fillStyle = "#22ddaa";
                } else if (this.game_result == "loss" && this.player ==  "Black" && this.winning_tiles.includes(piece)){
                    this.ctx.fillStyle = "red";
                } else{
                    this.ctx.fillStyle="white";
                }
                this.ctx.fill();
            }            
        }
        reset_pieces(trial){
            // Add listeners again if already removed
            if (trial.player == 1){
                let move = this.ai(Date.now(), "", "", 0, this.level);
                trial.pieces = [[move], []];
                this.current_state = move.toString();
            } else {
                // Reset tree            
                this.current_state = "root";
            }
            // Get puzzle board
            this.black_pieces = [[], []];
            this.white_pieces = [[], []];
            for(const piece of this.black_pieces){
                this.bp[piece] = 1;
            }
            for(const piece of this.white_pieces){
                this.wp[piece] = 1;
            }
            // Whose turn is it
            if (this.white_pieces.length == this.black_pieces.length){
                this.turn = "Black";
                this.player = "Black";
                this.opponent = 1;
            } else {
                this.turn = "White";
                this.player = "White";
                this.opponent = 0;
            }
        }
        update_top(){
            if (this.game_result == "win"){
                //let p = this.free_play ? 100 : this.length == 2 ? 100 : this.length == 3 ? 200 : this.length == 4 ? 300 : 0;
                let b = this.free_play ? 0.2 : this.length == 2 ? 0.25 : this.length == 3 ? 1.0 : this.length == 4 ? 2.0 : 0;
                this.top.innerHTML = `You won and got a 100 points!`;
                //this.top.innerHTML = `You won and got $${b} bonus reward!`;
            } else if (this.game_result == "loss"){
                this.top.innerHTML = `You lost and lost 50 points`;
            } else if (this.game_result == "tie"){
                this.top.innerHTML = `You tied and got 50 points!`;
            } else if (this.free_play){
                this.top.innerHTML = `Your turn to move (you are ${this.player})`;//Game ${this.game_index}: ${this.player == this.turn ? "Your" : "Opponent's"}
            }
        }
        // function to end trial when it is time
        end_trial(){
            // kill any remaining setTimeout handlers
            this.jsPsych.pluginAPI.clearAllTimeouts();
            // Kill listeners
            this.cvs.removeEventListener("mousemove", this.mouseMoveEventHandler);
            this.cvs.removeEventListener("mousedown", this.mouseDownEventHandler);
            // gather the data to store for the trial
            var trial_data = {
                game_index: this.game_index,
                solution: this.current_state,
                first_move_RT: this.first_move_RT,
                all_move_RT: this.move_RT,
                all_move_times: this.move_times,
                duration: performance.now() - this.currentTrialStartTime,
                level: this.level,
                player_color: this.player,
                result: this.game_result,
                mouse_movements: this.mouse_movements,
            };
            // clear the display
            this.display_element.innerHTML = "";
            // move on to the next trial
            this.jsPsych.finishTrial(trial_data);
        };
        trial(display_element, trial){
            this.level = trial.get_level();
            // seed, black_pieces, white_pieces, opponent_color, level
            this.ai = Module.cwrap('makemove', 'number', ['number','string','string','number','number']);
            // if (trial.player == 1){
            //     let move = this.ai(Date.now(), "", "", 0, this.level);
            //     trial.pieces = [[move], []];
            //     this.current_state = move.toString();
            // }
            this.reset_pieces(trial);
            this.game_index = trial.game_index;
            let pb = `
            <div id="progress-bar">
                <div id="progress"></div>
            </div>`
            // Display HTML Puzzle ${this.game_index}: 
            display_element.innerHTML = `
            <h1 id='top'>Your turn to move (you are ${this.player})</h1>
            <div id="container">
                <canvas id="game-canvas" width="${this.w}" height="${this.h}"></canvas>
            </div>`
            this.display_element = display_element;
            // Save references
            if (this.cvs == null) {
                this.cvs = document.getElementById('game-canvas');
                let rect = this.cvs.getBoundingClientRect();
                this.rect_left = rect.left;
                this.rect_top = rect.top;
                this.top = document.getElementById('top');
            }
            if (this.ctx == null) {
                this.ctx = this.cvs.getContext('2d');
            }
            // set current trial start time
            this.currentTrialStartTime = performance.now();
            this.lastSampleTime = performance.now();
            this.last_click_time = performance.now();
            // start data collection
            this.cvs.addEventListener("mousemove", this.mouseMoveEventHandler);
            this.cvs.addEventListener("mousedown", this.mouseDownEventHandler);
            // Draw board
            this.draw_board(null, null)
        }
    }
    FourInARowFreePlay.info = info;
  
    return FourInARowFreePlay;
  
})(jsPsychModule);