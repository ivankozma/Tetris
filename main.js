const cell = 10; // количество ячеек в строке
const rows = 15; // количество строк
const nextLevelLine = 15; //количество линий для перехода на следующий уровень

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');
const canvasNext = document.getElementById('next');
const ctxNext = canvasNext.getContext('2d');

var audioGame = document.getElementById('audioGame'); // мелодия при старте игры
audioGame.volume = 0.3; // громкость мелодии
var audioGameOver = document.getElementById('audioGameOver'); // мелодия при проигрыше

// var fieldSize = 50;  //переменная для расчета величины игрового поля 

// изменяем переменную для различных ширина окна
if (document.body.offsetWidth < 1000) {
  fieldSize = 30; 
} else if (document.body.offsetWidth < 850) {
  fieldSize = 20;
} else if (document.body.offsetWidth < 500) {
  fieldSize = 10;
} else {
  fieldSize = 50;
};

// определяем конфигирацию игровых фигурок
const shapes = [
  [],
  [[0, 0, 0, 0], 
   [1, 1, 1, 1], 
   [0, 0, 0, 0], 
   [0, 0, 0, 0]],

  [[1, 0, 0], 
   [1, 1, 1], 
   [0, 0, 0]],

  [[0, 0, 1], 
   [1, 1, 1], 
   [0, 0, 0]],

  [[1, 1], 
   [1, 1]],

  [[0, 1, 1], 
   [1, 1, 0], 
   [0, 0, 0]],

  [[0, 1, 0], 
   [1, 1, 1], 
   [0, 0, 0]],

  [[1, 1, 0], 
   [0, 1, 1], 
   [0, 0, 0]]
];
Object.freeze(shapes); // предотвращаем добавление новых свойств к объекту (shapes)


// усанавливаем цвета фигурок тетриса
const colors = [
  'none',
  'PowderBlue',
  'DeepSkyBlue',
  'LightSalmon',
  'LemonChiffon',
  'Teal',
  'MediumPurple',
  'Salmon'
];
Object.freeze(colors); // предотвращаем добавление новых свойств к объекту (colors)

// устанавливаем код клавиши клавиатуры
const KEY = {
  ESC: 27,
  SPACE: 32,
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40,
  P: 80
}
Object.freeze(KEY); // предотвращаем добавление новых свойств к объекту (KEY)

// количество очков за заполненные строки и за самостоятельное опускание фигурки
const points = {
  single: 100,
  double: 300,
  triple: 500,
  tetris: 800,
  softDrop: 1,
  fastDrop: 2,
}
Object.freeze(points); // предотвращаем добавление новых свойств к объекту (points)

const LEVEL = {
  0: 800,
  1: 720,
  2: 630,
  3: 550,
  4: 470,
  5: 380,
  6: 300,
  7: 220,
  8: 130,
  9: 100,
  10: 80,
  11: 80,
  12: 80,
  13: 70,
  14: 70,
  15: 70,
  16: 50,
  17: 50,
  18: 50,
  19: 30,
  20: 30,
}
Object.freeze(LEVEL); // предотвращаем добавление новых свойств к объекту (LEVEL)

// создаем класс для фигурок 
// объект класса Piece должен знать свое начальное положение, цвет, фигуру
class Piece {
  x;
  y;
  color;
  shape;
  ctx;
  typeId;

  constructor(ctx) {
    this.ctx = ctx;
    this.spawn();
  }

  spawn() {
    this.typeId = this.randomPieceType(colors.length - 1); // случайным образом выбирается фигура
    this.shape = shapes[this.typeId]; // форма фигуры
    this.color = colors[this.typeId]; // ее цвет
    this.x = 0; // начальное положение
    this.y = 0;
  }

  // Чтобы нарисовать фигуру тетриса на доске, проходим все ячейки фигуры. Если значение в ячейке больше нуля, то окрашиваем этот блок
  // this.x, this.y дает левую верхнюю позицию фигуры
  // x, y положение блока фигуры
  // this.x + x - это позиция фигуры на доске
  draw() {
    this.ctx.fillStyle = this.color;
    this.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value > 0) {
          this.ctx.fillRect(this.x + x, this.y + y, 1, 1);
        }
      });
    });
  }

  move(p) {
    this.x = p.x;
    this.y = p.y;
    this.shape = p.shape;
  }

  setStartPosition() {
    this.x = this.typeId === 4 ? 4 : 3;
  }

  randomPieceType(typePiece) {
    return Math.floor(Math.random() * typePiece + 1);
  }
}

class Board {
  ctx;
  ctxNext;
  grid;
  piece;
  next;
  requestId;
  time;

  constructor(ctx, ctxNext) {
    this.ctx = ctx;
    this.ctxNext = ctxNext;
    this.init();
  }

  init() {
    // Расчитываем размер игрового поля canvas с помощью констант
    this.ctx.canvas.width = cell * fieldSize;
    this.ctx.canvas.height = rows * fieldSize;

    // установим масштаб
    this.ctx.scale(fieldSize, fieldSize);
  }

  // сброс когда начинаем игру
  reset() {
    this.grid = this.getEmptyField();
    this.piece = new Piece(this.ctx);
    this.piece.setStartPosition();
    this.getNewPiece();
  }

  // следующая фигурка тетриса
  getNewPiece() {
    this.next = new Piece(this.ctxNext);
    this.ctxNext.clearRect(
      0,
      0, 
      this.ctxNext.canvas.width, 
      this.ctxNext.canvas.height
    );
    this.next.draw();
  }

  draw() {
    this.piece.draw();
    this.drawBoard();
  }

  drop() {
    let p = moves[KEY.DOWN](this.piece);
    if (this.valid(p)) {
      this.piece.move(p);
    } else {
      this.freeze();
      this.clearLines();
      if (this.piece.y === 0) {
        // Game over
        return false;
      }
      this.piece = this.next;
      this.piece.ctx = this.ctx;
      this.piece.setStartPosition();
      this.getNewPiece();
    }
    return true;
  }

  // удаление заполненных линий
  clearLines() {
    let lines = 0;
    let audioLine = document.getElementById('audioLine');
    audioLine.volume = 0.8;

    this.grid.forEach((row, y) => {

      // если значение каждого блока больше 0
      if (row.every(value => value > 0)) {
        lines++; // плюсуем к количеству линий 1

        // очищаем строку
        this.grid.splice(y, 1);

        // добавляем строку из нулей вверху
        this.grid.unshift(Array(cell).fill(0));
      }
    });
    
    if (lines > 0) {
      // считаем очки за линии и сами линии
      audioLine.play();
      account.score += this.getLinesClearedPoints(lines);
      account.lines += lines;

      // если количество линий достигнуло до след уровня
      if (account.lines >= nextLevelLine) {
        // прибавляем уровень
        account.level++;  
        
        // очищаем количесво строк в новом уровне
        account.lines -= nextLevelLine;

        // увеличиваем скорость игры
        time.level = LEVEL[account.level];
      }
    }
  }

  valid(p) { // проверка на столкновение с другими фигурами и стенками
    return p.shape.every((row, dy) => {
      return row.every((value, dx) => {
        let x = p.x + dx;
        let y = p.y + dy;
        return (
          value === 0 ||
          (this.insideWalls(x) && this.aboveFloor(y) && this.notOccupied(x, y))
        );
      });
    });
  }

  // если мы больше не можем двигаться вниз, то останавливаем фигуру и создаем новую
  freeze() {
    this.piece.shape.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value > 0) {
          this.grid[y + this.piece.y][x + this.piece.x] = value;
        }
      });
    });
  }

  drawBoard() {
    this.grid.forEach((row, y) => {
      row.forEach((value, x) => {
        if (value > 0) {
          this.ctx.fillStyle = colors[value];
          this.ctx.fillRect(x, y, 1, 1);
        }
      });
    });
  }

   
  getEmptyField() {
    return Array.from({ length: rows }, () => Array(cell).fill(0));
  }

  // ограничение стенами тетриса
  insideWalls(x) {
    return x >= 0 && x < cell;
  }

  // ограничение полом тетриса
  aboveFloor(y) {
    return y <= rows;
  }

  notOccupied(x, y) {
    return this.grid[y] && this.grid[y][x] === 0;
  }

  rotate(piece) {
    // Клонируем с помощью JSON для неизменности
    let p = JSON.parse(JSON.stringify(piece));

    // транспонируем матрицу для поворота фигуры
    for (let y = 0; y < p.shape.length; ++y) {
      for (let x = 0; x < y; ++x) {
        [p.shape[x][y], p.shape[y][x]] = [p.shape[y][x], p.shape[x][y]];
      }
    }

    // обратный порядок столбцов
    p.shape.forEach(row => row.reverse());
    return p;
  }

  // если удалено несколько линий сразу
  getLinesClearedPoints(lines, level) {
    const lineClearPoints =
      lines === 1 ? points.single : lines === 2 ? points.double : lines === 3 ? points.triple : lines === 4 ? points.tetris : 0;
    return (account.level + 1) * lineClearPoints;
  }
}

// через Proxy добавяем значения в accountValues
let accountValues = {
  score: 0,
  level: 0,
  lines: 0
}

function updateAccount(key, value) {
  let element = document.getElementById(key);
  if (element) {
    element.textContent = value;
  }
}

let account = new Proxy(accountValues, {
  set: (target, key, value) => {
    target[key] = value;
    updateAccount(key, value);
    return true;
  }
});

let requestId;

moves = {
  [KEY.LEFT]: p => ({ ...p, x: p.x - 1 }),
  [KEY.RIGHT]: p => ({ ...p, x: p.x + 1 }),
  [KEY.DOWN]: p => ({ ...p, y: p.y + 1 }),
  [KEY.SPACE]: p => ({ ...p, y: p.y + 1 }),
  [KEY.UP]: p => board.rotate(p)
};

let board = new Board(ctx, ctxNext);
eventControl(); // функция с событиями управления фигурами тетриса
initNext();

function initNext() {
  // расчет размера "следующей" фигурки тетриса
  ctxNext.canvas.width = 4 * fieldSize;
  ctxNext.canvas.height = 4 * fieldSize;
  ctxNext.scale(fieldSize, fieldSize);
}

function eventControl() {
  document.addEventListener('keydown', eventKeyboard, false);
  document.getElementById('left_button').addEventListener('click', funcLeft, false);
  document.getElementById('right_button').addEventListener('click', funcRight, false);
  document.getElementById('rotate_button').addEventListener('click', funcRotate, false);
  document.getElementById('down_button').addEventListener('click', funcDown, false);
  document.getElementById('drop_button').addEventListener('click', funcDrop, false);

  // функция обработки событий на клавиатуре
  function eventKeyboard(event) {
    // если нажата кликнута клавиша 'p'
    if (event.keyCode === KEY.P) {
      pause(); // взываем функцию pause()
    }
    // если ESC
    if (event.keyCode === KEY.ESC) {
      gameOver();
      // если клик клавиши, у которой код равен ключу из объекта moves
    } else if (moves[event.keyCode]) {
      event.preventDefault();
      // новое состояние фигуры тетриса
      let p = moves[event.keyCode](board.piece);
      // если пробел
      if (event.keyCode === KEY.SPACE) {
        // бросок вниз
        while (board.valid(p)) { // пока значение true (перед тем как двигать фигуру, проверка на столкновение с другой фигурой или стенками)
          account.score += points.fastDrop; // прибавляем очки за самостоятельное опускание фигуры
          board.piece.move(p); // двигаем фигуру
          p = moves[KEY.DOWN](board.piece);
        }       
      } else if (board.valid(p)) { // если значение true (перед тем как двигать фигуру, проверка на столкновение с фигурой или стенками)
        board.piece.move(p); // двигаем фигуру
        if (event.keyCode === KEY.DOWN) {
          account.score += points.softDrop; // прибавляем очки за самостоятельное опускание фигуры       
        }
      }
    }
  };

  // функции обработки событий клика по кнопкам управления
  function funcLeft(event) {
    vibro(true); // виброотклик
    event.preventDefault();
    let p = moves[KEY.LEFT](board.piece);
    if (board.valid(p)) {
      board.piece.move(p);
    }
  }

  function funcRight(event) {
    vibro(true);
    event.preventDefault();
    let p = moves[KEY.RIGHT](board.piece);
    if (board.valid(p)) {
      board.piece.move(p);
    }
  }

  function funcRotate(event) {
    vibro(true);
    event.preventDefault();
    let p = moves[KEY.UP](board.piece);
    if (board.valid(p)) {
      board.piece.move(p);
    }
  }

  function funcDown(event) {
    vibro(true);
    event.preventDefault();
    let p = moves[KEY.DOWN](board.piece);
    if (board.valid(p)) {
      board.piece.move(p);
    }
    account.score += points.softDrop;         
  }

  function funcDrop(event) {
    vibro(true);
    event.preventDefault();
    let p = moves[KEY.SPACE](board.piece);
    while (board.valid(p)) {
      account.score += points.fastDrop;
      board.piece.move(p);
      p = moves[KEY.DOWN](board.piece);
    }       
  }
}

// Сброс игры
function resetGame() {
  account.score = 0;
  account.lines = 0;
  account.level = 0;
  board.reset();
  // устанавлиаем начальное время
  time = { start: 0, elapsed: 0, level: LEVEL[account.level] };
}

function vibro(longFlag) {
  if ( navigator.vibrate ) { // есть поддержка Vibration API?
      if ( !longFlag ) {
          window.navigator.vibrate(100); // вибрация 100мс
      }
      else {
          window.navigator.vibrate([100,50,100,50,100]); // вибрация 3 раза по 100мс с паузами 50мс
      }
  }
}


function play() {
  resetGame();
  audioGame.play();
  time.start = performance.now();
  // если запущена игра, отменяем её
  if (requestId) {
    cancelAnimationFrame(requestId);
  }

  document.querySelector('.play-button').textContent='Restart';
  document.querySelector('.pause-button').style.display='block';

  animate();
  
}
// В игровом цикле мы обновляем наше игровое состояние на основе временного интервала, а затем выводим результат.
function animate(now = 0) {
  // обновление времени
  time.elapsed = now - time.start;
  if (time.elapsed > time.level) {
    time.start = now;
    if (!board.drop()) { // при заполнении игрового поля
      gameOver();
      return;
    }
  }
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  board.draw();
  requestId = requestAnimationFrame(animate);
}

// функция при проигрыше
function gameOver() {
  cancelAnimationFrame(requestId);
  audioGame.pause(); // пауза звука игры
  audioGameOver.play(); // звук game over
  navigator.vibrate(1000);
  // TODO:vibro(true); // многократная вибрация
  // // рисуем табличку GAME OVER c количеством очков
  ctx.fillStyle = 'DarkGrey'; 
  ctx.fillRect(1, 3, 8, 3);
  ctx.font = '1px Arial';
  ctx.fillStyle = 'SandyBrown';
  ctx.fillText('GAME OVER', 1.8, 4);
  ctx.fillText('Score: ' + account.score, 3, 5.5);
}

// при нажатии игровой кнопки PAUSE
function pause() {
  if (!requestId) {
    audioGame.play();
    animate();
    return;
  }

  audioGame.pause();
  cancelAnimationFrame(requestId);
  requestId = null;
  // рисуем табличку с надписью PAUSE
  ctx.fillStyle = 'yellow';
  ctx.fillRect(1, 3, 8, 1.2);
  ctx.font = '1px Arial';
  ctx.fillStyle = 'white';
  ctx.fillText('PAUSED', 3, 4);
}

function toggleSound() {
  audioGame.muted = !audioGame.muted;
  const soundButton = document.getElementById('buttonSound');
  if(soundButton.classList.contains("underline")) {
    soundButton.classList.remove("underline");
  } else {
    soundButton.classList.add("underline");
  }
}

// при нажатии на кнопку Game Rules пявляются сверху правила игры с анимацией
function rules() {
  var gameRules = document.querySelector('.game-rules');
  gameRules.style.top = '25vmin';

  navigator.vibrate(500);
}

function showRules() {
  var gameRules = document.querySelector('.game-rules');
  gameRules.style.top = '-100vmax';
}

// анимация для кнопок 
if (document.body.animate) {
  document.querySelector('.play-button').addEventListener('click', pop);
  document.querySelector('.pause-button').addEventListener('click', pop);
  document.querySelector('.rules-button').addEventListener('click', pop);
  document.querySelector('.sound-button').addEventListener('click', pop);
}

function pop (EO) {
  // нажал ли пользователь кнопку с помощью клавиатуры (без мышки)
  if (EO.clientX === 0 && EO.clientY === 0) {
    const bbox = document.querySelector('#button').getBoundingClientRect(); //возвращаем размер элемента и его позицию относительно viewport (части страницы, которая показанна на экране, и которую мы видим)
    const x = bbox.left + bbox.width / 2;
    const y = bbox.top + bbox.height / 2;
    for (let i = 0; i < 100; i++) {
      //вызываем функцию createCircle 100 раз
      // передаем функции координаты кнопки х у
      createCircle(x, y);
    }
  } else {
    for (let i = 0; i < 100; i++) {
      // вызываем функцию createCircle 100 раз
      // в качестве аргументов передаем кординаты клика мыши
      createCircle(EO.clientX, EO.clientY);
    }
  }
}

function createCircle (x, y) {
  const particle = document.createElement('particle');
  document.body.appendChild(particle);
  
  //рандомные значения от 15px до 25px
  const size = Math.floor(Math.random() * 10 + 15);
  particle.style.width = `${size}px`; // ${size} то значение, которое будет в size
  particle.style.height = `${size}px`;
  // рандомные цвета  
  particle.style.background = `hsl(${Math.random() * 250 + 55}, 100%, 60%)`;
  
  // рандомное положение кружков при клике на расстоянии 50px от места клика
  const destinationX = x + (Math.random() - 0.5) * 2 * 250;
  const destinationY = y + (Math.random() - 0.5) * 2 * 250;

  // сохраним анимацию, чтоы пользоваться ей позже
  const animation = particle.animate([
    {
      // устанавлиаем начальную позицию кружка и смещаем на половину размера, чтобы расположить вокруг мыши
      transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
      opacity: 1
    },
    {
      // рандомные координаты при перемещении кружков
      transform: `translate(${destinationX}px, ${destinationY}px)`,
      opacity: 0
    }
  ], {
    //случайная продолжительность анимации
    duration: Math.random() * 1000 + 1500,
    // движение кружков
    easing: 'cubic-bezier(0, 0.82, 0.52, 0.9)',
    // рандомная задерка кружков до 200ms
    delay: Math.random() * 200
  });
  
  // когда анимация завершится, удаляем элемент с кружками из DOM
  animation.onfinish = () => {
    particle.remove();
  };
}

// появление формы для введения имени игрока
function showProfileForm() {
  const gameRule = document.getElementById("gameRule");
  gameRule.classList.remove("gameRule");

  var userForm = document.getElementById("userForm");
  userForm.classList.remove("hidden");
  userForm.classList.add("user-form");
}

// отправляем данные об игроке на сервер
let infoPlayer={
  firstName: document.getElementById("firstName").value
}; 

let ajaxHandlerScript="https://fe.it-academy.by/AjaxStringStorage2.php";
let updatePassword;
let stringName='KOZMA_IVAN_TETRIS';


// добавляем имя игрока в блок с именем, меняем состояние странице и убираем форму
// const createPlayer = document.getElementById("btnSubmitForm");

function createPlayer () {
  playerInfo();
  readFromServer();

  if (firstName.value!=""){
    const btnPlay = document.getElementById("btnPlay");
    btnPlay.classList.remove("hidden");

    const buttonControl = document.getElementById("buttonControl");
    buttonControl.classList.add("hidden");

    const formGroup = document.getElementById("formGroup");
    formGroup.classList.add("hidden");
    formGroup.classList.remove("form-group");
  } 
  const userName = document.getElementById("userName");
  userName.classList.remove("hidden");
  userName.classList.add("user_name");
  let text = firstName.value
  userName.textContent = text;
};


function skipPlayer () {


    const btnPlay = document.getElementById("btnPlay");
    btnPlay.classList.remove("hidden");

    const buttonControl = document.getElementById("buttonControl");
    buttonControl.classList.add("hidden");

    const formGroup = document.getElementById("formGroup");
    formGroup.classList.add("hidden");
    formGroup.classList.remove("form-group");

};

// переход в игровое поле
const goToPlay = document.getElementById("goToPlay");

goToPlay.addEventListener("click", ()=> {
    userForm.classList.remove("user-form");
    userForm.classList.add("hidden");

    const gameField = document.getElementById("gameField");
    gameField.classList.remove("hidden");
    gameField.classList.add("grid");
}); 

// взаимодействие с сервером для получения имени игрока
function playerInfo(infoPlayer) {
    $.ajax( {
            url : ajaxHandlerScript, type : 'POST', cache : false, dataType:'json',
            data : { f : 'INSERT', n : stringName, v: JSON.stringify(infoPlayer)},
            success : lockGetReady, error : err
        }
    );
}

function lockGetReady(callresult) {
  console.log(callresult.result);
}

function err () {
    console.log('1');
}

function updateReady () {
    console.log('2');
}

function readFromServer() {
  $.ajax({
    url : ajaxHandlerScript, type : 'POST', cache : false, dataType:'json',
    data: {f: 'READ', n: stringName},
    success: readReady, error:err
  });
}

function readReady(callresult) {
  if (callresult.error !== undefined) {
    alert(callresult.error);
  } else if(callresult.result === '') {
    console.log('String not found');
  } else {
    var profileInfo=JSON.parse(callresult.result);
    document.getElementById("firstName").value = profileInfo.firstName;
  };
}

