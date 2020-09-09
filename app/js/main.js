const path = require('path');
const {ipcRenderer} = require('electron');
// Set current time to time bar
let today = new Date();
let year = today.getFullYear();
let month = today.getMonth();
let day = today.getDate();
let dayOfWeek = today.getDay();

let weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
setCurrentTime();

function setCurrentTime() {
    $('#day').text(day < 10 ? "0"+day : day);
    $('#month').text((month+1) < 10 ? "0"+(month+1) : month+1);
    $('#year').text(year);
    $('#day-of-week').text(weekday[dayOfWeek]);
}

// Initialize data
let numCompletedTasks = 0;
let numPausingTasks = 0;
let numCurrentTasks = 0;
ipcRenderer.on('TaskItems:Initial', (event, data) => {
    try {
        const taskList = JSON.parse(data);
        taskList.forEach(taskItem => {
            if(taskItem.status === "doing"){
                const taskContainer = $('#current-task-component-template').clone(true);
                taskContainer.removeAttr("id");
                taskContainer.show();
                taskContainer.children('div.task-item').text(taskItem.name);
                $('#current-tasks').prepend(taskContainer);
                numCurrentTasks += 1;
            }
            else if(taskItem.status === "paused"){
                const taskContainer = $('#pausing-task-component-template').clone(true);
                taskContainer.removeAttr("id");
                taskContainer.show();
                taskContainer.children('div.task-item').text(taskItem.name);
                $('#pausing-tasks').prepend(taskContainer);
                numPausingTasks += 1;
            }
            else if(taskItem.status === "completed"){
                const taskContainer = $('#completed-task-component-template').clone(true);
                taskContainer.removeAttr("id");
                taskContainer.show();
                taskContainer.children('div.task-item').text(taskItem.name);
                $('#completed-tasks').prepend(taskContainer);
                numCompletedTasks += 1;
            }
        });
        updateProgressBar()
    } catch (error) {
        console.log(error);
    }
})
// Update progess bar
function updateProgressBar(){
    $('#completed-tasks-bar').css('flex-grow', numCompletedTasks);
    $('#pausing-tasks-bar').css('flex-grow', numPausingTasks);
    $('#current-tasks-bar').css('flex-grow', numCurrentTasks);
    $('#num-completed-tasks').text(numCompletedTasks);
    $('#num-pausing-tasks').text(numPausingTasks);
    $('#num-current-tasks').text(numCurrentTasks);

}

// Add new task item
let addingTaskContent;
$('#add-task-icon').click(() => {
    const taskContent = $('#input-task').val();
    addingTaskContent = taskContent;
    const dataSend = JSON.stringify({
        date: today.toDateString(), 
        task: taskContent
    })
    $('#input-task').val("");
    ipcRenderer.send('TaskItem:add', dataSend);
})
$('#input-task').keypress(function(event){
    var keycode = (event.keyCode ? event.keyCode : event.which);
    if(keycode == '13'){
        const taskContent = $('#input-task').val();
        addingTaskContent = taskContent;
        const dataSend = JSON.stringify({
            date: today.toDateString(), 
            task: taskContent
        })
        $('#input-task').val("");
        ipcRenderer.send('TaskItem:add', dataSend);
    }
});

ipcRenderer.on('TaskItem:completeAdd', (_, data) => {
    if(data === addingTaskContent){
        const taskContainer = $('#current-task-component-template').clone(true);
        taskContainer.removeAttr("id");
        taskContainer.show();
        taskContainer.children('div.task-item').text(data);
        $('#current-tasks').prepend(taskContainer);
        numCurrentTasks += 1;
        updateProgressBar();
    }
})

// Handle event for task control buttons
//1. Complete task
let selectingTaskElement;
let selectingTaskContent;
$('.btn-complete').click(function(){
    // Send changing task status to server
    const taskContent = $(this).parent().prev().text();
    selectingTaskElement = $(this).parent().parent();
    selectingTaskContent = taskContent;
    const sendingDeleteMessage = JSON.stringify({
        date: today.toDateString(),
        task: taskContent,
    });
    ipcRenderer.send("TaskItem:complete", sendingDeleteMessage);
})

ipcRenderer.on('TaskItem:completeChangeCompletedStatus', (event, data) => {
    // console.log("received message", data);
    if(data === selectingTaskContent){

        //append the task item to completed task area
        const taskContainer = $('#completed-task-component-template').clone(true);
        taskContainer.removeAttr("id");
        taskContainer.show();
        taskContainer.children('div.task-item').text(selectingTaskContent);
        $('#completed-tasks').prepend(taskContainer);
        //remove the task item from current task area
        selectingTaskElement.remove();
        numCurrentTasks -= 1;
        numCompletedTasks += 1;
        updateProgressBar()
    }
})
//2. Pause task
$('.btn-pause').click(function(){
    // Send changing task status to server
    const taskContent = $(this).parent().prev().text();
    selectingTaskElement = $(this).parent().parent();
    selectingTaskContent = taskContent;
    const sendingPauseMessage = JSON.stringify({
        date: today.toDateString(),
        task: taskContent,
    });
    ipcRenderer.send("TaskItem:pause", sendingPauseMessage);
})

ipcRenderer.on('TaskItem:completeChangePausedStatus', (event, data) => {
    // console.log("received message", data);
    if(data === selectingTaskContent){
        //append the task item to completed task area
        const taskContainer = $('#pausing-task-component-template').clone(true);
        taskContainer.removeAttr("id");
        taskContainer.show();
        taskContainer.children('div.task-item').text(selectingTaskContent);
        $('#pausing-tasks').prepend(taskContainer);
        //remove the task item from current task area
        selectingTaskElement.remove();
        numCurrentTasks -= 1;
        numPausingTasks += 1;
        updateProgressBar()
    }
})
//3. Continue task
$('.btn-continue').click(function(){
    // Send changing task status to server
    const taskContent = $(this).parent().prev().text();
    selectingTaskElement = $(this).parent().parent();
    selectingTaskContent = taskContent;
    const sendingContinueMessage = JSON.stringify({
        date: today.toDateString(),
        task: taskContent,
    });
    ipcRenderer.send("TaskItem:continue", sendingContinueMessage);
})

ipcRenderer.on('TaskItem:completeChangeContinuingStatus', (event, data) => {
    // console.log("received message", data);
    if(data === selectingTaskContent){
        //append the task item to completed task area
        const taskContainer = $('#current-task-component-template').clone(true);
        taskContainer.removeAttr("id");
        taskContainer.show();
        taskContainer.children('div.task-item').text(selectingTaskContent);
        $('#current-tasks').prepend(taskContainer);
        //remove the task item from current task area
        selectingTaskElement.remove();
        numCurrentTasks += 1;
        numPausingTasks -= 1;
        updateProgressBar()
    }
})
//3. Delete task
$('.btn-delete').click(function(){
    // Send changing task status to server
    const taskContent = $(this).parent().prev().text();
    selectingTaskElement = $(this).parent().parent();
    selectingTaskContent = taskContent;
    const sendingDeleteMessage = JSON.stringify({
        date: today.toDateString(),
        task: taskContent,
    });
    ipcRenderer.send("TaskItem:delete", sendingDeleteMessage);
})

ipcRenderer.on('TaskItem:completDeleteTask', (event, data) => {
    // console.log("received message", data);
    data = JSON.parse(data);
    if(data.task === selectingTaskContent){
        //remove the task item from current task area
        selectingTaskElement.remove();
        if(data.status === "doing"){
            numCurrentTasks -= 1;
        }
        else if(data.status === "pausing"){
            numPausingTasks -= 1;
        }
        else if(data.status === 'completed'){
            numCompletedTasks -= 1;
        }
        updateProgressBar();
    }
})

// Handle reset button --> reload page
$('.btn-reset').click(function(){
    ipcRenderer.send("TaskItem:reset", today.toDateString());
})

ipcRenderer.on('TaskItems:reload', (event, data) => {
    numCompletedTasks = 0;
    numPausingTasks = 0;
    numCurrentTasks = 0;
    try {
        $('#current-tasks').empty();
        $('#pausing-tasks').empty();
        $('#completed-tasks').empty();
        const taskList = JSON.parse(data);
        taskList.forEach(taskItem => {
            if(taskItem.status === "doing"){
                const taskContainer = $('#current-task-component-template').clone(true);
                taskContainer.removeAttr("id");
                taskContainer.show();
                taskContainer.children('div.task-item').text(taskItem.name);
                $('#current-tasks').prepend(taskContainer);
                numCurrentTasks += 1;
            }
            else if(taskItem.status === "paused"){
                const taskContainer = $('#pausing-task-component-template').clone(true);
                taskContainer.removeAttr("id");
                taskContainer.show();
                taskContainer.children('div.task-item').text(taskItem.name);
                $('#pausing-tasks').prepend(taskContainer);
                numPausingTasks += 1;
            }
            else if(taskItem.status === "completed"){
                const taskContainer = $('#completed-task-component-template').clone(true);
                taskContainer.removeAttr("id");
                taskContainer.show();
                taskContainer.children('div.task-item').text(taskItem.name);
                $('#completed-tasks').prepend(taskContainer);
                numCompletedTasks += 1;
            }
        });
        updateProgressBar()
    } catch (error) {
        console.log(error);
    }

})


// Toggle expand or collapse icon 
// 1. Pausing Area
$('#pausing-list-toggle').click(function(){
    $('#icon-collapse-pausing-tasks').toggle();
    $('#icon-expand-pausing-tasks').toggle();
    $('#pausing-tasks').toggle();
})
// 1. Completed Area
$('#completed-list-toggle').click(function(){
    $('#icon-collapse-completed-tasks').toggle();
    $('#icon-expand-completed-tasks').toggle();
    $('#completed-tasks').toggle();
})



// window.onbeforeunload = () => {
//     ipcRenderer.send("Reload:Page")
// };