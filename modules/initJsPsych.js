// Initialize jsPsych
var jsPsych = initJsPsych({
    show_progress_bar: true,
    on_close: function(e){
      e.preventDefault();
      e.returnValue = '';
    },
  });