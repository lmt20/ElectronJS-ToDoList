const path = require('path');
const { ipcRenderer } = require('electron');
// Set current time to time bar
let today = new Date();
let year = today.getFullYear();
let month = today.getMonth();
let day = today.getDate();
let dayOfWeek = today.getDay();

let weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
setCurrentTime();

function setCurrentTime() {
  $('#day').text(day < 10 ? "0" + day : day);
  $('#month').text((month + 1) < 10 ? "0" + (month + 1) : month + 1);
  $('#year').text(year);
  $('#day-of-week').text(weekday[dayOfWeek]);
}

// Initialize data
// recipients
$('#recipients').val('lam.nguyenquynh@vietis.com.vn, bich.luongthi@vietis.com.vn');
// subject
let dateFormateString = `${day < 10 ? "0" + day : day}/${(month + 1) < 10 ? "0" + (month + 1) : month + 1}/${year}`;
let subjectContent = `[TRAINING_JS_NODEJS] Daily report ${dateFormateString}`;
$('#subject').val(subjectContent);
// get content
let finalContent;
let taskListCreated = "";
let taskListCompleted = "";
let taskListPaused = "";
let completedPercent = 0;

ipcRenderer.send('TaskItems:getAll');
ipcRenderer.on('TaskItems:completeGetAll', (event, data) => {
  const tasksList = JSON.parse(data);
  let countCompletedTask = 0;
  let countPausedTask = 0;
  let countTask = 0;
  tasksList.forEach(taskItem => {
    countTask += 1;
    taskListCreated += (countTask === 1 ? countTask + ". " + taskItem.name : '\n' + countTask + ". " + taskItem.name);
    if (taskItem.status === "paused") {
      countPausedTask += 1;
      taskListPaused += (countPausedTask === 1 ? countPausedTask + ". " + taskItem.name : '\n' + countPausedTask + ". " + taskItem.name);
    } else if (taskItem.status === "completed") {
      countCompletedTask += 1;
      taskListCompleted += (countCompletedTask === 1 ? countCompletedTask + ". " + taskItem.name : '\n' + countCompletedTask + ". " + taskItem.name);
    }
  });
  completedPercent = (countCompletedTask / countTask * 100).toFixed(2);
  finalContent = `Em Lê Mạnh Trường báo cáo tiến độ ngày ${dateFormateString}
Link theo dõi bài tập:
Link Demo: https://internship-vietis.herokuapp.com
Github: https://github.com/lmt20/InternshipVietIS.git
GoogleDriver: https://drive.google.com/drive/folders/1sKnIEKbWfZ2C71S7MXjmWN6dsLWrN0Ur
A. Plan today
${taskListCreated}
B. Actual today - ${completedPercent}%
${taskListCompleted}
C. Issue
${taskListPaused}
------------------------------------------------------------
Le Manh Truong,
Posts and Telecommunications Institute of Technology
Address: No 82A, Tran Phu, Ha Dong, Ha NoiPhone: (+84)332588883
Skype: live:lemanhtruong.ptit
------------------------------------------------------------`
  $('#mail-content').val(finalContent);
})

// send mail
$('#btn-send').click(() => {
  $('#btn-send').text("Sending...")
  let nodemailer = require('nodemailer');

  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'truonglm@vietis.com.vn',
      pass: 'Lmt0112358!@#'
    }
  });

  let mailOptions = {
    from: 'truonglm@vietis.com.vn',
    // to: 'truonglm@vietis.com.vn',
    to: $('#recipients').val(),
    subject: `[TRAINING_JS_NODEJS] Daily report ${dateFormateString}`,
    text: $('#mail-content').val(),
  };

  transporter.sendMail(mailOptions, function (error, info) {
    if (error) {
      console.log(error);
    } else {
      console.log('Email sent: ' + info.response);
      $('#btn-send').text("Send")
      new Notification('Successfully', {
        title: 'Successfully!',
        body: 'The email sent successfully!',
        icon: path.join(__dirname, 'images', 'gmail.png'),
      })
    }
  });
})