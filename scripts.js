/* vim:set foldmethod=marker: */

/**
 * @fileOverview 小学校６年生の算数　水槽に水を入れたときに、任意の流量a,b に対して、
 * 何分で水槽がいっぱいになるのかを説明するため。
 * javascript言語ベースのp5js言語で開発. <br/>
 * ～備忘録～<br/>
 * @author MURAYAMA, Yoshiyuki
 * @version 1.0.0
 */

/** 音声関係*/
let audioCtx;
let noise;
let noiseGain;
let bubbleOsc;
let bubbleGain;
let running = false;
let lfo;
//let waterH = 0;//waterLevelは、もう使われている

/** 音声関係終わり*/

const BASE_WIDTH = 800;
const BASE_HEIGHT = 600;

let offsetX = 0;
let offsetY = 0; //キャンバスの平行移動
let wholeScale = 1;
let dragging = false;
let lastMouseX, lastMouseY;

// ドラッグ用
let lastTouchX = null;
let lastTouchY = null;
let lastTouchDist = null; //ピンチズーム用

/** ブラウザの画面の横幅いっぱい.
 * @type {Number}
 */
var iWidth = window.innerWidth;
/** ブラウザの画面の縦幅いっぱい. 
 * @type {Number} 
 */
var iHeight = window.innerHeight;

let inputBoxA; //入力欄Aの変数
let inputBoxB; //入力欄Bの変数

let inputAValue = 2;  //読み込んだ入力Aの変数
let inputBValue = 3;  //読み込んだ入力Bの変数

let inputLabelA;  //入力欄Aの文字列
let inputLabelB;  //入力欄Bの文字列


let btnCalculate; //実行ボタン
let btnReset;//リセットボタン

let waterHeight = 0; //水の高さ(アニメーション用 蛇口の水)
let waterLevel = 0; //水の高さ(アニメーション用 水槽)
let isFlowA = false;
let isFlowB = false;

let dAFlow = 0;	//入力Aの値
let dBFlow = 0; //入力Bの値

let bJaguchi = false; //蛇口の水が水槽に到達したかどうか

let totalTime = 0; //必要時間

let stopper = 0;  //途中で水の流れを一時停止するためのもの


//Aの表示・非表示ボタン
let visible_A_X = 10;//630;
let visible_A_Y = 50;//120;

//Bの表示・非表示ボタン
let visible_B_X = 50;//630;
let visible_B_Y = 50;//240;

//ABの表示・非表示ボタン
let visible_AB_X = 90;//630;
let visible_AB_Y = 50;//425;

//式の　表示・非表示ボタン
let visible_EQ_X = 140;//630;
let visible_EQ_Y = 50;//520;

//通分の　表示・非表示ボタン
let visible_ML_X = 180;//830;
let visible_ML_Y = 50;//520;

//答えの　表示・非表示ボタン
let visible_Answer_X =230;// 1030;
let visible_Answer_Y =50;// 520;

//A途中スタート・ストップボタン
let runA_X = 10;
let runA_Y = 100;

//B途中スタート・ストップボタン
let runB_X = 80;
let runB_Y = 100;


//AやBの表示非表示 runA、runB　の動作中・一時停止中のフラグ
let isShowA = isShowB = isShowAB = isShowEQ = isShowML = isShowAnswer = isRunA = isRunB = false;

/** リセットボタンが押下された.
 */
function onMousePressedReset() { /**{{{*/
  isFlowA = isFlowB = false;
  waterLevel = waterHeight = 0;
  bJaguchi = false;
  isRunA = isRunB = false;
  stopper = 0;
  runA.html("A再生");
}
/**}}}*/

//計算実行
function onMousePressedCalculate() { /** {{{*/
  
  //計算実行のため、テキストボックスのデータを取得する.
  
  dAFlow = parseFloat(atoiLike(inputBoxA.value()));
  dBFlow = parseFloat(atoiLike(inputBoxB.value()));

  console.log("dAFlow = [" + dAFlow + "] dBFlow = [" + dBFlow + "]");
  isFlowA = isFlowB = true;

  //必要な時間を計測する
  if ( dAFlow == 0 && dBFlow == 0 ) {
    console.log("Devided By 0 error.");
    return;
  } else {
    totalTime = (dAFlow * dBFlow) / (dAFlow + dBFlow);
    console.log("totalTime = " + totalTime);
  }

 
  

}
/**}}}*/


/** setup()関数の先頭に記述してあるため、setup()よりも先に呼び出される.
 * スマホ・タブレット（iOS・Android）か、PCかをuserAgentを調べることで、判別する.
 * これにより、isPCにtrueかfalseが入るため、これ以降のプログラムでは、isPCを見れば、
 * PCかどうかがわかる.
 */
function preload() { /** {{{*/
 
	if(navigator.userAgent.match(/(iPhone|iPad|iPod|Android)/i)){
		// スマホ・タブレット（iOS・Android）の場合の処理を記述
		isPC = false;
	}else{
		// PCの場合の処理を記述
		isPC = true;
	}
	// setupより先に実行
	//font = loadFont("Meiryo.ttf");
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}
/**}}}*/

//---------------------------------------
// ★ iPad（ピンチでズーム）
//---------------------------------------
function touchMoved(event) { /**{{{*/
   // 2本指（ピンチズーム）
  if (touches.length == 2) {
    let t1 = touches[0];
    let t2 = touches[1];

    let dx = t1.x - t2.x;
    let dy = t1.y - t2.y;
    let dist = sqrt(dx*dx + dy*dy);

    if (lastTouchDist !== null) {
      let change = dist / lastTouchDist;

      // ピンチ中心
      let cx = (t1.x + t2.x) / 2;
      let cy = (t1.y + t2.y) / 2;

      // ズーム前の世界座標
      const wx = (cx - offsetX) / wholeScale;
      const wy = (cy - offsetY) / wholeScale;

      // ズーム
      wholeScale *= change;

      // ズーム後のオフセット補正
      offsetX = cx - wx * wholeScale;
      offsetY = cy - wy * wholeScale;
    }
    lastTouchDist = dist;
    return false;
  }

  // 1本指（パン）
  if (touches.length == 1) {
    if (isDragging) {
    let x = touches[0].x;
    let y = touches[0].y;

    offsetX += x - lastTouchX;
    offsetY += y - lastTouchY;

    lastTouchX = x;
    lastTouchY = y;
  }

  // スクロール禁止（重要）
    return false;
  }
  return false;
}
/**}}}*/


function touchEnded() { /**{{{*/
   if (touches.length < 2) {
    lastTouchDist = null;
     isDragging = false;
  }
}

/**}}}*/

/** 文字を強制的に数値に変換する.しかもエラーは一切出さないようにする.
 * @param str 読み込んだ文字列
 * @return 数値 文字列として読み込めなかったら0
 */
function atoiLike(str) { /** {{{*/
  if (!str) return 0;
  
  //全角→半角変換
  const hankaku = str.replace(/[０-９.ー]/g, function (ch) {
    return String.fromCharCode(ch.charCodeAt(0) - 0xFEE0 );
  });

  const match = hankaku.match(/-?\d+(\.\d+)?/);
  return match ? parseFloat( match[0] ) : 0;
    
}
/**}}}*/

/** 最初に1回だけ実行. 初期値の図形情報を詰め込むのはここ.
 * 
 */
function setup(){ /** {{{*/
	preload();
	//スマホ画面で下に移動すると、更新してしまう問題を回避
	/*window.addEventListener("touchstart", function (event) { event.preventDefault(); }, { passive: false });
	window.addEventListener("touchmove", function (event) { event.preventDefault(); }, { passive: false });
	*/

	window.addEventListener("touchstart", function(ev) {
	  const t = ev.target;
	  if ( t ) {
	    const tag = t.tagName;
	    if ( tag === 'BUTTON' || tag === 'INPUT' || t.closest && t.closest('button, input, textarea, .p5ui') ) {
	      //ui要素なら何もしない
	      return;
	    }
	  }
	  //それ以外では、スクロールを無効化
	  ev.preventDefault();
	} , { passive: false });

	window.addEventListener("touchmove", function (ev) {
	  const t = ev.target;
	  if (t) {
	    const tag = t.tagName;
	    if (tag === 'BUTTON' || tag === 'INPUT' || t.closest && t.closest('button, input, textarea, .p5ui')) {
	      return;
	    }
	  }
	  ev.preventDefault();
	}, { passive: false });

	cursor('pointer');
	//キャンバスを作成
	textSize(30);
	//fill( 0, 0, 255 );
	createCanvas(iWidth, iHeight);
	drawBackground();
	//textFont(font);

  //ラベル
  


  //テキスト入力ボックスを作成
  inputBoxA = createInput('2'); //初期値0
  inputBoxA.position( 100, 15 ); //画面上の位置
  inputBoxA.size(100);	 
  inputBoxA.style('text-align', 'right');

  inputBoxB = createInput('3');
  inputBoxB.position( 350, 15);
  inputBoxB.size(100);
  inputBoxB.style('text-align', 'right');

  inputLabelA = createElement('label', 'Aの水の量');
  inputLabelA.position(10,15);
  inputLabelB = createElement('label', 'Bの水の量');
  inputLabelB.position(260,15);

  

  btnCalculate = createButton('実行');
  btnCalculate.position(550, 15);
  btnCalculate.mousePressed(onMousePressedCalculate);

  btnReset = createButton('リセット');
  btnReset.position(650, 15);
  btnReset.mousePressed(onMousePressedReset);


  btnVisible_A = createButton('A');
  btnVisible_A.position(visible_A_X, visible_A_Y);
  btnVisible_A.mousePressed(() => {
    isShowA = !isShowA;  
  });

  btnVisible_B = createButton('B');
  btnVisible_B.position(visible_B_X, visible_B_Y);
  btnVisible_B.mousePressed(() => {
    isShowB = !isShowB;
  });

  btnVisible_AB = createButton('AB');
  btnVisible_AB.position(visible_AB_X, visible_AB_Y);
  btnVisible_AB.mousePressed(()=>{
    isShowAB = !isShowAB;
  });

  //式
  btnVisible_EQ = createButton('式');
  btnVisible_EQ.position(visible_EQ_X, visible_EQ_Y);
  btnVisible_EQ.mousePressed(()=>{
    isShowEQ = !isShowEQ;
  });

  //通分
  btnVisible_ML = createButton('通分');
  btnVisible_ML.position(visible_ML_X, visible_ML_Y);
  btnVisible_ML.mousePressed(()=>{
    isShowML = !isShowML;
  });

  //答え
  btnVisible_Answer = createButton('答え');
  btnVisible_Answer.position(visible_Answer_X, visible_Answer_Y);
  btnVisible_Answer.mousePressed(()=>{
    isShowAnswer = !isShowAnswer;
  });
  //runA
  runA = createButton('A再生');
  runA.position(runA_X, runA_Y);
  runA.mousePressed(()=>{
    if( isRunA ) {
      stopper++;
      if ( stopper > dAFlow  ) {
	stopper = dAFlow;
      }
    } else {
      isRunA = !isRunA;
    }
  });

  console.log("B再生スタート");
  //runB
  runB = createButton('B再生');
  runB.position(runB_X, runB_Y);
  runB.mousePressed(()=> {
    if ( isRunB ) {
      stopper++;
      if (stopper > dBFlow ) {
	stopper = dBFlow;
      }
    } else {
	isRunB = !isRunB;
    }
  });
  console.log("B再生エンドisRunB = " + isRunB);



  lastMouseX = mouseX;
  lastMouseY = mouseY;

  //btnCut = createButton('カットモード');
	//btnCut.position(30,30);
	//btnCut.mousePressed( cutter );
    
  /**音声合成
   */
 // AudioContext
 /* audioCtx = new (window.AudioContext || window.webkitAudioContext)();

  // ノイズ生成
  const bufferSize = audioCtx.sampleRate * 2;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  noiseSource = audioCtx.createBufferSource();
  noiseSource.buffer = buffer;
  noiseSource.loop = true;

  // ローパスフィルタ（ザー音を柔らかくする）
  noiseFilter = audioCtx.createBiquadFilter();
  noiseFilter.type = "lowpass";
  noiseFilter.frequency.value = 1000;

  // ザー音の音量
  gainNode = audioCtx.createGain();
  gainNode.gain.value = 0;

  // 接続
  noiseSource.connect(noiseFilter);
  noiseFilter.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  noiseSource.start();

*/

  /** 音声合成終わり*/


}
/**}}}*/


function chkboxevent() { /**{{{*/
	isGridChecked = chkbox.checked();
}
/**}}}*/



/** マウスがドラッグされたら.
 * 図形外の時は、何もしない.
 * 図形内の時は、ドラッグすれば対象図形のみが移動し、レイヤーを最前列にする.
 * 図形内外で、各頂点から、許容量以内の場合は回転モードにする.
 * mousePressed()メソッドで、どの図形を選択しているかの情報は得ているので、
 * 回転か移動かの判断はここのメソッドだけで判断してもよい.
 */
function mouseDragged() { /** {{{*/
  if ( dragging ) {
    offsetX += (mouseX - lastMouseX);
    offsetY += (mouseY - lastMouseY);
    lastMouseX = mouseX;
    lastMouseY = mouseY;
  }
}
/** }}}*/

/** マウスのドラッグが終わったら*/
function mouseReleased() { /** {{{*/
  dragging = false;
}
/**}}}*/

//---------------------------------------
// ★ マウスホイールで、"マウス位置を中心に" ズーム
//---------------------------------------
function mouseWheel(event) { /** {{{*/
  let zoom = 1.0;

  if (event.delta > 0) zoom = 0.9;   // ズームアウト
  else zoom = 1.1;                   // ズームイン

  // マウス座標をキャンバスの座標系に変換
  const wx = (mouseX - offsetX) / wholeScale;
  const wy = (mouseY - offsetY) / wholeScale;

  // ズーム適用
  wholeScale *= zoom;

  // ズーム位置の中心がマウスになるようにオフセット調整
  offsetX = mouseX - wx * wholeScale;
  offsetY = mouseY - wy * wholeScale;

  return false; // ブラウザのスクロールを防ぐ
}
/**}}}*/


/** mousePressedイベント. もしかしたらtouchとかも考えないといけないかもしれないから、一応分割した.
 * @param pinputX pmouseXか、ptouchXのどっちか.		@type {Number}
 * @param pinputY pmouseYか、ptouchYのどっちか.		@type {Number}
 * @param inputX mouseXか、touches[0].xのどっちか.	@type {Number}
 * @param inputY mouseYか、touches[0].yのどっちか.	@type {Number}
 */
function pressProcess( pinputX, pinputY, inputX, inputY  ) { /** {{{*/
  dragging = true;
  lastMouseX = mouseX;
  lastMouseY = mouseY;
	//console.log("モード: isCutmode=" + isCutMode + "isAddMode=" + isAddMode);
}
/**}}}*/


/** マウスが押下されたイベント.touchStartedにも対応するために、そのまんまpressProcessに流す. */
function mousePressed() { /** {{{*/
	pressProcess( pmouseX, pmouseY, mouseX, mouseY );
}
/** }}}*/

/** タッチクリックされたイベント. 
 * mousePressedにも対応するために、そのまんまpressProcessに流しているが、
 * タッチモードでは、createButtonに対応していない.
 * そのため、タッチされた時の座標からボタンイベント判別している.*/
function touchStarted() { /** {{{*/
	//両脇の時のスワイプは無効にする.
	/*if ( touches[0].x > 16 && touches[0].x < window.innerWidth-16 ) {
		pressProcess( ptouchX, ptouchY, touches[0].x, touches[0].y );
	} else {
		e.preventDefault();
	}
	let touchXX, touchYY;//タッチされたtouches[0]の座標
	touchXX = touches[0].x;
	touchYY = touches[0].y;
	*/
    isDragging = true;

     // finger 0 の位置を使う
      lastTouchX = touches[0].x;
      lastTouchY = touches[0].y;
}
/**}}}*/



function windowResized() { /** {{{*/
  resizeCanvas(BASE_WIDTH, BASE_HEIGHT);
  
  const scaleX = windowWidth / BASE_WIDTH;
  const scaleY = windowHeight / BASE_HEIGHT;
  const scaleFactor = min(scaleX, scaleY);

  // 入力ボックス位置・サイズをscaleFactorに合わせて調整
  inputBoxA.position(100 * scaleFactor, 15 * scaleFactor);
  inputBoxA.size(100 * scaleFactor);

  inputBoxB.position(350 * scaleFactor, 15 * scaleFactor);
  inputBoxB.size(100 * scaleFactor);

  inputLabelA.position(10 * scaleFactor, 15 * scaleFactor);
  inputLabelB.position(260 * scaleFactor, 15 * scaleFactor);

  //draw();
}
/**}}}*/


/**1フレームごとに実行.processing,p5jsでは、ここがループしている.
 */
function draw(){ /** {{{*/
  //現在のパン・ズーム状態を適用
  translate( offsetX, offsetY);
  scale(wholeScale);


	/* マウスでもタッチでもどちらでも対応できるように、PCではマウス、タブレット、スマホではタッチ対応にさせる.*/
	let pinputX;	//前のX座標
	let pinputY;	//前のY座標
	let inputX;		//現在のX座標
	let inputY;		//現在のY座標

  let tankWidth = 450;	    //水槽の幅
  let tankHeight = 300;	    //水槽の高さ
  //画面の実サイズを取得
  const scaleX = windowWidth / BASE_WIDTH;
  const scaleY = windowHeight / BASE_HEIGHT;
  const scaleFactor = min (scaleX, scaleY);   //縦横の縮尺のうち、小さい方を使う(縦横比を保つ)

  //キャンバス全体を拡大縮小
  push();
  scale(scaleFactor); 

  btnVisible_A.position( offsetX + visible_A_X * wholeScale, offsetY + visible_A_Y*wholeScale);
  btnVisible_B.position( offsetX + visible_B_X * wholeScale, offsetY + visible_B_Y*wholeScale);
  btnVisible_AB.position( offsetX + visible_AB_X * wholeScale, offsetY + visible_AB_Y*wholeScale);
  btnVisible_EQ.position( offsetX + visible_EQ_X * wholeScale, offsetY + visible_EQ_Y*wholeScale);
  btnVisible_ML.position( offsetX + visible_ML_X * wholeScale, offsetY + visible_ML_Y*wholeScale);
  btnVisible_Answer.position( offsetX + visible_Answer_X * wholeScale, offsetY + visible_Answer_Y*wholeScale);
  runA.position( offsetX + runA_X * wholeScale, offsetY + runA_Y * wholeScale);
  runB.position( offsetX + runB_X * wholeScale, offsetY + runB_Y * wholeScale);


  /*if ( isPC == true ) {
		//マウスを検出するようにする.
		pinputX = pmouseX;
		pinputY = pmouseY;
		inputX  = mouseX;
		inputY  = mouseY;
	} else {
		//タブレットを検出するようにする.
		if ( touches.length != 0 ) {
			pinputX = ptouchX;
			pinputY = ptouchY;
			inputX  = touches[0].x;
			inputY  = touches[0].y;
		}
	}
  */
	drawBackground();


  /*if ( isPC == false ) {
		if ( touches.length != 0 ) {
			ptouchX = touches[0].x;
			ptouchY = touches[0].y;
		}
	}*/

	drawFaucet(100, 150);//蛇口を描画する.
	//蛇口を鏡像反転したもの.
	push();
	translate(500, 0);
	scale(-1,1);  //横方向だけ反転
	drawFaucet(100,150);
	pop();
      
	//水槽を描画する
	drawSink(tankWidth, tankHeight);

  //水を流すアニメーション
  drawTankWater(tankWidth, tankHeight);

  //A,Bに対して、分割分ずつ水を入れていく.
  drawDevideTankWater(tankWidth, tankHeight);


  //バーを表示する.
  drawBar('A');
  drawBar('B');

 
}
/** }}}*/

/** バーを表示する.
 * @param AorB 'A': Aの数直線 'B': Bの数直線
 * */
function drawBar(AorB) { /**{{{*/
  stroke(0); //線の色を黒に
  strokeWeight(2); //線の太さを2pxに
  let iCounter;
  let step;
  let startX = 550;
  let endX   = 1000;
  let delta = 0;

  if ( isShowA ) {
    line(startX, 100, endX,100);
    line(startX, 80, startX, 120);
    line(endX, 80, endX, 120);
  }

  if ( isShowB ) {
    line(startX, 200, endX, 200);
    line(startX, 180, startX, 220);
    line(endX, 180, endX, 220);
  }

  if ( isShowAB ) {
    line(startX, 350, endX,350);
    line(startX, 330, startX, 370);
    line(endX, 330, endX, 370);
  }

  //Aの-1-をかく
  noFill();
  strokeWeight(1);
  if ( isShowA) {
    arc( (startX + endX ) / 2,
	100,
	endX - startX,
	100,
	radians(-60),
	radians(0)
    );
    arc( (startX + endX ) / 2,
	100,
	endX - startX,
	100,
	radians(180),
	radians(-120)
    );
  }

  //Bの-1-をか
  if ( isShowB) {
    arc( (startX + endX ) / 2,
	200,
	endX - startX,
	100,
	radians(-60),
	radians(0)
    );
    arc( (startX + endX ) / 2,
	200,
	endX - startX,
	100,
	radians(180),
	radians(-120)
    );
  }
  
  //A+Bの-1-をかく
  if ( isShowAB ) {
    arc( (startX + endX ) / 2,
      350,
      endX - startX,
      100,
      radians(-60),
      radians(0)
    );
    arc( (startX + endX ) / 2,
      350,
      endX - startX,
      100,
      radians(180),
      radians(-120)
    );
  }

  textAlign(CENTER);
  fill(0);
  
  if (isShowA) {text("1", (startX+endX)/2, 60)};
  if (isShowB) {text("1", (startX+endX)/2, 150)};
  if (isShowAB) {text("1", (startX+endX)/2, 300)};



  dAFlow = parseFloat(atoiLike(inputBoxA.value()));
  dBFlow = parseFloat(atoiLike(inputBoxB.value()));

  if ( AorB == 'A' && dAFlow != 0 ) {
    //Aの分割線を描く
    step = (endX-startX) / dAFlow; 
    if ( isShowA ) {
      for( iCounter = startX + step; iCounter <= endX; iCounter += step  ) {
	line( iCounter, 90, iCounter, 110);
      }
    }
    if ( isShowAB ) {
      line( startX+step, 340, startX+step, 360 );
    }
      //1つ分の線分
    noFill();
    strokeWeight(2);
    stroke(255, 0, 0);
    if (isShowA) {
      arc( startX + step/2, 100, step, 40, radians(180), radians(0) );
      drawFraction(startX + step/2, 50, "1", inputBoxA.value());
    
    }
    if ( isShowAB ) {
      arc( startX + step/2, 350, step, 40, radians(180), radians(0) );
      drawFraction(startX + step/2, 300, "1", inputBoxA.value());
    }
      stroke(0);
    strokeWeight(1);
  } else if ( AorB == 'B' && dBFlow != 0 ) {
    //Bの分割線を描く
    step = (endX-startX) / dBFlow;
    if ( isShowB) {
      for( iCounter = startX + step; iCounter <= endX; iCounter += step  ) {
	line( iCounter, 190, iCounter, 210);
      }
    }
    //もし、Aの水の量が有効でなかったらstartXからになる
    if ( dAFlow != 0 ) {
      delta = (endX-startX) / dAFlow
    } else{}

    if ( isShowAB ) {
      line( startX+step+delta, 340, startX+step+delta, 360 );
    }

    //1つ分の線分
    noFill();
    strokeWeight(2);
    stroke(0, 0, 255);
    if ( isShowB ) {
      arc( startX + step/2, 200, step, 40, radians(180), radians(0) );
      drawFraction(startX + step/2, 150, "1", inputBoxB.value());
    }
    if ( isShowAB ) {
      arc( startX + step/2+delta, 350, step, 40, radians(180), radians(0) ); 
      drawFraction(startX + step/2 + delta, 300, "1", inputBoxB.value());
    }
    //合計の線分
    stroke(0, 155, 0);
    if ( isShowAB ) {
      arc((startX + (step + delta)/2), 350, step+delta, 40, radians(0), radians(180));
    }
      //計算結果は、下の数式のところになるため、そこに記述.
      stroke(0);
      strokeWeight(1);
    
  }

  //数式を表示する.
  if ( dAFlow != 0 && dBFlow != 0  ) {
    //数式
    stroke(0,0,0);fill(0);
    if ( isShowEQ ) {
      text("式", startX+10, 430);
    }

    if (isShowEQ) {
      stroke(255, 0, 0);
      fill(255,0, 0);
    
      drawFraction(startX , 470, "1", inputBoxA.value());
      fill(0);stroke(0,0,0);
      text("+", startX+40, 470);
      stroke(0, 0, 255);fill(0, 0, 255);
      drawFraction(startX + 80 , 470, "1", inputBoxB.value());
      fill(0);stroke(0,0,0);
      text("=", startX+120, 470);
    }
    //通分
    //

    let aa = dAFlow;//左の分母
    let bb = dBFlow;//右の分母

    let L = lcm(aa,bb); //最小公倍数
    let leftMul = L / aa;//左の分子に掛ける数
    let rightMul = L / bb;//右の分子に掛ける数

    if ( isShowML ) {
      stroke(255, 0, 0 ); fill(255, 0, 0);
      drawFraction( startX + 160, 470, leftMul, L );

      fill(0);stroke(0,0,0);
      text("+", startX+200, 470);
    
      stroke(0, 0, 255);fill(0, 0, 255);
      drawFraction(startX + 240 , 470, rightMul, L);
      fill(0);stroke(0,0,0);
      text("=", startX+280, 470);
    }
    //答え




    let a = new Fraction(1, dAFlow);
    let b = new Fraction(1, dBFlow);
    let c = a.add(b);
    let numerator = c.n;
    let denominator = c.d;
    //console.log("denominator = " + c.n);

    if ( isShowAnswer ) {
      drawFraction(startX + 320 , 470, c.n , c.d); //計算
    }
    //線分の方
    stroke(0, 200, 0);fill(0,155,0);
    if (delta != 0 ) {
      if ( isShowAnswer ) {
	drawFraction((startX + (step + delta)/2), 400, c.n, c.d);
      }
    }
      //console.log("startX[" + startX + "] step["+step+"] delta["+delta+"]");
     /*

  console.log(a.add(b).toFraction());   // → "1/2"
  console.log(a.mul(b).toFraction());   // → "1/18"
  */




  }

}
/**}}}*/


/** 分数を表示する*/
function drawFraction(x, y, numerator, denominator) { /** {{{*/
  textAlign(CENTER, CENTER);
  push();
  textSize(18);
  text(numerator, x, y - 15);
  line(x - 15, y, x + 15, y);
  text(denominator, x, y + 15);
  pop();
}
/**}}}*/


/** 水槽の中の水を順番に入れていく.
 * A,Bそれぞれのボタンを用意して、押下されたら、水を流して、
 * 1/a で、水を一旦止める.また、ボタンが押下されたら、2/a ・・・ 3/aと
 * 繰り返していき、a/aまで進む.a/aで以上にはならない。
 * @param tankWidth 水槽の幅
 * @param tankHeight 水槽の高さ
 **/
function drawDevideTankWater( tankWidth, tankHeight ) { /** {{{*/

  //一時停止、再生の表示を変える.
  isRunA ? runA.html("次") : runA.html("A再生");

  //まず、ボタンが押下されたかどうか.
  //console.log("runA = " + isRunA);
  
  if ( isRunA ) {//runAモード[Aの蛇口を途中で切っていきながら流していく.]
    //水が伸びていくアニメーション
    drawJaguchiWater(tankWidth, tankHeight, "A");

    //水槽に水をためる
    drawStorageTank( tankWidth, tankHeight, "A");
  }

  if ( isRunB ) {
    //水が伸びていくアニメーション
    drawJaguchiWater(tankWidth, tankHeight, "B");

    //水槽に水をためる
    drawStorageTank( tankWidth, tankHeight, "B");
    
  }
}
/**}}}*/


/** 水槽に水をためる
 * @param tankWidth 水槽の幅
 * @param tankHeight 水槽の高さ
 * @param szX "A":Aを選択 "B":Bを選択
 **/
function drawStorageTank(tankWidth, tankHeight, szX) {
  let dXFlow;//流量
  if ( szX == "A" ) {
    dXFlow = dAFlow;
  } else if ( szX == "B" ) {
    dXFlow = dBFlow;
  }

  if ( bJaguchi ) {
    let flowSpeed = ( 1 / (( dXFlow))*10);

    startWaterSound();
    if ( waterLevel > ( tankHeight / dXFlow ) * stopper ) { /**途中で止める*/
      stopWaterSound();
    } else {
      waterLevel += flowSpeed;
    }

    if (waterLevel > tankHeight ) {
      waterLevel = tankHeight;
      stopWaterSound();
    }

    //水をためる描画
    noStroke();
    fill( 0, 150, 255, 180 );
    rect( 51, 499, tankWidth -2, -waterLevel );
  }
}


/** 水が伸びていくアニメーションを描画する.
 * @param tankWidth 水槽の幅
 * @param tankHeight 水槽の高さ
 * @param szX "A": Aを選択  "B": Bを選択
 **/
function drawJaguchiWater(tankWidth, tankHeight, szX) {
  let point_X;//蛇口の水のX座標
  let point_Y;//蛇口の水のY座標
  let dXFlow;//流量
  if ( szX == "A" ) {
    console.log("Aを選択");
    point_X = 100 + 85;
    point_Y = 150 + 43 + 18;
    dXFlow = dAFlow;
  } else if ( szX == "B" ) {
    point_X = 500 - 205;
    point_Y = 150 + 43 + 18;
    dXFlow = dBFlow;
    console.log("Bを選択");
  } else {
    //AでもBでもないので、バグ
  }
  waterHeight += 5;
  if ( !bJaguchi ) {
    drawWater( point_X, point_Y, waterHeight, dXFlow );
    if ( waterHeight >= 285 ) {
      waterHeight-=5;
      bJaguchi = true; //蛇口のみずがそこに溜まってからじゃないと、水位は上がらないはず.
    }
  } else { //たまった後なので、tankHeightは定義されている.
    if ( tankHeight - waterLevel - 13 > 0 ) {
      drawWater( point_X, point_Y, tankHeight-waterLevel-13, dXFlow );
    }
  }

}


/** 水槽の中の水を描画する.*/
function drawTankWater(tankWidth, tankHeight) { /** {{{*/
   if ( isFlowA || isFlowB ) {
    //水が伸びていくアニメーション
    waterHeight+=5;//速度
    //蛇口の下に水を描く
    if ( !bJaguchi ) {
      drawWater( 100 + 85 , 150 + 43 + 18, waterHeight, dAFlow);//A側
      drawWater( 500 - 205, 150 + 43 + 18, waterHeight, dBFlow);//B側
      if ( waterHeight >= 285 ) {
	waterHeight-=5;
	bJaguchi = true;	//蛇口の水が底にたまってからじゃないと、水位は上がらないはず
      }
    } else { //たまった後なので、tankHeightは定義されている.
      if ( tankHeight - waterLevel - 13 > 0 ) {
      drawWater( 100+85, 150 + 43 + 18, tankHeight-waterLevel-13, dAFlow );
      drawWater( 500 - 205, 150 + 43 + 18, tankHeight - waterLevel - 13, dBFlow);//B側
      }
    }
    //水槽に水をためる
    if (bJaguchi) {
      let flowSpeed = (1/(dAFlow + dBFlow))*10;
      //console.log("流量 = dAFlow:" + dAFlow + " + dBFlow:"+dBFlow + " = flowSpeed:" + flowSpeed);
      waterLevel += flowSpeed;
      startWaterSound();  //音声合成開始
      //水が満タンになったら停止
      if ( waterLevel > tankHeight) {
	waterLevel = tankHeight;
	//isFlowA = isFlowB = false;//勝手に終わってしまうから。
	stopWaterSound();
      }
      //水をためる描画
      noStroke();
      fill(0, 150, 255, 180);
      rect(51, 499, tankWidth-2, -waterLevel );
    }
  }

}
/**}}}*/

function drawWater(x, y, h, dFlow) { /** {{{*/
  if ( dFlow != 0) {
    fill(0, 150, 255, 180); // 水色
    noStroke();
    // 2-20 
    rect(x + min(10, dFlow/2), y, max(1,22-dFlow), h);  // x,y を水の出る位置として、20px幅で描画
  }
}
/**}}}*/


/**水槽を描画する.
 * @param iWidth 横幅
 * @param iHeight 高さ
 */
function drawSink( iWidth, iHeight ) { /** {{{*/
  stroke(0); //線の色を黒に
  strokeWeight(2); //線の太さを2pxに
  line(50, 500, 50, 500-iHeight);
  line(50, 500, 50 + iWidth, 500);
  line(50 + iWidth, 500, 50 + iWidth, 500 - iHeight);
}

/**}}}*/

/** 蛇口を描く
 */
function drawFaucet( x, y ) { /** {{{*/
   // 色定義
  let metalDark = color(120);
  let metalMid = color(180);
  let metalLight = color(220);

  noStroke();

  // 壁の丸いベース
  fill(metalDark);
  ellipse(x, y + 20, 70, 70);
  fill(metalMid);
  ellipse(x, y + 20, 55, 55);
  fill(metalLight);
  ellipse(x, y + 20, 42, 42);

  // 首のパイプ（太め）
  noFill();
  stroke(140);
  strokeWeight(20);
  strokeCap(ROUND);
  line(x + 22, y + 20, x + 70, y + 20);

  // 90度曲がった部分
  strokeWeight(18);
  arc(x + 70, y + 43, 50, 60, PI + HALF_PI, 0);

  // 吐水口
  noStroke();
  fill(metalMid);
  rect(x + 75, y + 43, 40, 18, 5);

  // 丸ハンドル（太め）
  noStroke();
  fill(metalMid);
  ellipse(x, y, 50, 50);
  fill(metalLight);
  ellipse(x, y, 30, 30);
  fill(metalDark);
  ellipse(x, y, 15, 15);
        }
/**}}}*/

/**背景を描画する*/
function drawBackground() { /** {{{*/
    stroke(0);
  strokeWeight(1);
		background( 255, 255, 204 );
	for ( var iCounter = 0; iCounter < iHeight; iCounter+=20 ) {
		for ( var jCounter = 0; jCounter < iWidth; jCounter += 20 ) {
			point( jCounter, iCounter );
		}
	}
}
/**}}}*/


/** 最小公倍数を求めるための関数の1つ*/
function gcd(a, b) { /** {{{*/
  return b === 0 ? a : gcd(b, a % b);
}
/**}}}*/

/** 最小公倍数を求めるための関数の１つ*/
function lcm(a, b) { /**{{{*/
  return a * b / gcd(a, b);
}
/**}}}*/




function startWaterSound() { /** {{{*/
  if ( !audioCtx ) {
    audioCtx = getAudioContext();
  }
  audioCtx.resume();

  if ( running) return;
  running = true;

  // ---- ノイズ(水の流れるザーッという音) ----
  noise = audioCtx.createBufferSource();
  const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 2, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for ( let i = 0; i < data.length; i++ ) {
    data[i] = (Math.random() * 2 - 1 ) * 0.7;//white noise
  }
  noise.buffer = buffer;
  noise.loop = true;

  noiseGain = audioCtx.createGain();
  noiseGain.gain.value = 0.1;

  noise.connect(noiseGain).connect(audioCtx.destination);
  noise.start();

  //あわの音
  /*bubbleOsc = audioCtx.createOscillator();
  bubbleOsc.type = "sine";

  bubbleGain = audioCtx.createGain();
  bubbleGain.gain.value = 0.2;

  bubbleOsc.connect(bubbleGain).connect(audioCtx.destination);
  bubbleOsc.start();

    */
  //LFOでぼこぼこ音
  /*lfo = audioCtx.createOscillator();
  lfo.frequency.value = 4;
  const lfoGain = audioCtx.createGain();
  lfoGain.gain.value = 0.2;

  lfo.connect(lfoGain);
  lfoGain.connect(noiseGain.gain);
  lfo.start();
  */
} 
/**}}}*/

function stopWaterSound() { /** {{{*/
  if ( !running) return;
  running = false;

  noise.stop();
  //bubbleOsc.stop();
}
/**}}}*/

// ▼ waterLevel に応じて音を変化（0〜287）
function updateWaterLevelSound(waterLevel) { /** {{{*/
  if (!running) return;

  // 0.0〜1.0 に正規化
  let t = waterLevel / 287;

  // 水位が上がるほど高音に（リアル）
  noiseGain.gain.value = 0.4 - 0.25 * t;

  // 泡の頻度：水位が低いほど bubble が多い
  bubbleOsc.frequency.value = 4 + t * 60;

  // 泡の強さ：最初は強く、満水でゼロ
  bubbleGain.gain.value = 0.2 * (1 - t);
}
/**}}}*/



function waterRiseLoop() { /** {{{*/
  waterH += 0.01;
  if (waterH >= 1) {
    stopWaterSound();
    return;
  }
  // ザー音のフィルタ周波数を上げる（高くなる）
  noiseFilter.frequency.linearRampToValueAtTime(
    1000 + waterH * 2000,
    audioCtx.currentTime + 0.1
  );

  // 次フレーム
  setTimeout(waterRiseLoop, 50);
}
/**}}}*/



function playBubble() { /** {{{*/
  // ランダム気泡音
  const osc = audioCtx.createOscillator();
  const bubbleGain = audioCtx.createGain();

  // 気泡の音程 (水位で変化)
  osc.frequency.value = 200 + waterH * 400;

  bubbleGain.gain.value = 0.2;
  bubbleGain.gain.exponentialRampToValueAtTime(
    0.0001,
    audioCtx.currentTime + 0.3
  );

  osc.connect(bubbleGain);
  bubbleGain.connect(audioCtx.destination);

  osc.start();
  osc.stop(audioCtx.currentTime + 0.3);
}
/**}}}*/

/*
Fraction.js v4.2.0 05/03/2022
https://www.xarg.org/2014/03/rational-numbers-in-javascript/

Copyright (c) 2021, Robert Eisele (robert@xarg.org)
Dual licensed under the MIT or GPL Version 2 licenses.
*/
/**{{{*/
(function(z){function p(a,c){var b=0,d=1,f=1,l=0,k=0,t=0,x=1,u=1,g=0,h=1,v=1,q=1;if(void 0!==a&&null!==a)if(void 0!==c){if(b=a,d=c,f=b*d,0!==b%1||0!==d%1)throw m.NonIntegerParameter;}else switch(typeof a){case "object":if("d"in a&&"n"in a)b=a.n,d=a.d,"s"in a&&(b*=a.s);else if(0 in a)b=a[0],1 in a&&(d=a[1]);else throw m.InvalidParameter;f=b*d;break;case "number":0>a&&(f=a,a=-a);if(0===a%1)b=a;else if(0<a){1<=a&&(u=Math.pow(10,Math.floor(1+Math.log(a)/Math.LN10)),a/=u);for(;1E7>=h&&1E7>=q;)if(b=(g+
v)/(h+q),a===b){1E7>=h+q?(b=g+v,d=h+q):q>h?(b=v,d=q):(b=g,d=h);break}else a>b?(g+=v,h+=q):(v+=g,q+=h),1E7<h?(b=v,d=q):(b=g,d=h);b*=u}else if(isNaN(a)||isNaN(c))d=b=NaN;break;case "string":h=a.match(/\d+|./g);if(null===h)throw m.InvalidParameter;"-"===h[g]?(f=-1,g++):"+"===h[g]&&g++;if(h.length===g+1)k=r(h[g++],f);else if("."===h[g+1]||"."===h[g]){"."!==h[g]&&(l=r(h[g++],f));g++;if(g+1===h.length||"("===h[g+1]&&")"===h[g+3]||"'"===h[g+1]&&"'"===h[g+3])k=r(h[g],f),x=Math.pow(10,h[g].length),g++;if("("===
h[g]&&")"===h[g+2]||"'"===h[g]&&"'"===h[g+2])t=r(h[g+1],f),u=Math.pow(10,h[g+1].length)-1,g+=3}else"/"===h[g+1]||":"===h[g+1]?(k=r(h[g],f),x=r(h[g+2],1),g+=3):"/"===h[g+3]&&" "===h[g+1]&&(l=r(h[g],f),k=r(h[g+2],f),x=r(h[g+4],1),g+=5);if(h.length<=g){d=x*u;f=b=t+d*l+u*k;break}default:throw m.InvalidParameter;}if(0===d)throw m.DivisionByZero;e.s=0>f?-1:1;e.n=Math.abs(b);e.d=Math.abs(d)}function r(a,c){if(isNaN(a=parseInt(a,10)))throw m.InvalidParameter;return a*c}function n(a,c){if(0===c)throw m.DivisionByZero;
var b=Object.create(m.prototype);b.s=0>a?-1:1;a=0>a?-a:a;var d=w(a,c);b.n=a/d;b.d=c/d;return b}function y(a){for(var c={},b=a,d=2,f=4;f<=b;){for(;0===b%d;)b/=d,c[d]=(c[d]||0)+1;f+=1+2*d++}b!==a?1<b&&(c[b]=(c[b]||0)+1):c[a]=(c[a]||0)+1;return c}function w(a,c){if(!a)return c;if(!c)return a;for(;;){a%=c;if(!a)return c;c%=a;if(!c)return a}}function m(a,c){p(a,c);if(this instanceof m)a=w(e.d,e.n),this.s=e.s,this.n=e.n/a,this.d=e.d/a;else return n(e.s*e.n,e.d)}var e={s:1,n:0,d:1};m.DivisionByZero=Error("Division by Zero");
m.InvalidParameter=Error("Invalid argument");m.NonIntegerParameter=Error("Parameters must be integer");m.prototype={s:1,n:0,d:1,abs:function(){return n(this.n,this.d)},neg:function(){return n(-this.s*this.n,this.d)},add:function(a,c){p(a,c);return n(this.s*this.n*e.d+e.s*this.d*e.n,this.d*e.d)},sub:function(a,c){p(a,c);return n(this.s*this.n*e.d-e.s*this.d*e.n,this.d*e.d)},mul:function(a,c){p(a,c);return n(this.s*e.s*this.n*e.n,this.d*e.d)},div:function(a,c){p(a,c);return n(this.s*e.s*this.n*e.d,
this.d*e.n)},clone:function(){return n(this.s*this.n,this.d)},mod:function(a,c){if(isNaN(this.n)||isNaN(this.d))return new m(NaN);if(void 0===a)return n(this.s*this.n%this.d,1);p(a,c);if(0===e.n&&0===this.d)throw m.DivisionByZero;return n(this.s*e.d*this.n%(e.n*this.d),e.d*this.d)},gcd:function(a,c){p(a,c);return n(w(e.n,this.n)*w(e.d,this.d),e.d*this.d)},lcm:function(a,c){p(a,c);return 0===e.n&&0===this.n?n(0,1):n(e.n*this.n,w(e.n,this.n)*w(e.d,this.d))},ceil:function(a){a=Math.pow(10,a||0);return isNaN(this.n)||
isNaN(this.d)?new m(NaN):n(Math.ceil(a*this.s*this.n/this.d),a)},floor:function(a){a=Math.pow(10,a||0);return isNaN(this.n)||isNaN(this.d)?new m(NaN):n(Math.floor(a*this.s*this.n/this.d),a)},round:function(a){a=Math.pow(10,a||0);return isNaN(this.n)||isNaN(this.d)?new m(NaN):n(Math.round(a*this.s*this.n/this.d),a)},inverse:function(){return n(this.s*this.d,this.n)},pow:function(a,c){p(a,c);if(1===e.d)return 0>e.s?n(Math.pow(this.s*this.d,e.n),Math.pow(this.n,e.n)):n(Math.pow(this.s*this.n,e.n),Math.pow(this.d,
e.n));if(0>this.s)return null;var b=y(this.n),d=y(this.d),f=1,l=1,k;for(k in b)if("1"!==k){if("0"===k){f=0;break}b[k]*=e.n;if(0===b[k]%e.d)b[k]/=e.d;else return null;f*=Math.pow(k,b[k])}for(k in d)if("1"!==k){d[k]*=e.n;if(0===d[k]%e.d)d[k]/=e.d;else return null;l*=Math.pow(k,d[k])}return 0>e.s?n(l,f):n(f,l)},equals:function(a,c){p(a,c);return this.s*this.n*e.d===e.s*e.n*this.d},compare:function(a,c){p(a,c);var b=this.s*this.n*e.d-e.s*e.n*this.d;return(0<b)-(0>b)},simplify:function(a){if(isNaN(this.n)||
isNaN(this.d))return this;a=a||.001;for(var c=this.abs(),b=c.toContinued(),d=1;d<b.length;d++){for(var f=n(b[d-1],1),l=d-2;0<=l;l--)f=f.inverse().add(b[l]);if(f.sub(c).abs().valueOf()<a)return f.mul(this.s)}return this},divisible:function(a,c){p(a,c);return!(!(e.n*this.d)||this.n*e.d%(e.n*this.d))},valueOf:function(){return this.s*this.n/this.d},toFraction:function(a){var c,b="",d=this.n,f=this.d;0>this.s&&(b+="-");1===f?b+=d:(a&&0<(c=Math.floor(d/f))&&(b=b+c+" ",d%=f),b=b+d+"/",b+=f);return b},toLatex:function(a){var c,
b="",d=this.n,f=this.d;0>this.s&&(b+="-");1===f?b+=d:(a&&0<(c=Math.floor(d/f))&&(b+=c,d%=f),b=b+"\\frac{"+d+"}{"+f,b+="}");return b},toContinued:function(){var a=this.n,c=this.d,b=[];if(isNaN(a)||isNaN(c))return b;do{b.push(Math.floor(a/c));var d=a%c;a=c;c=d}while(1!==a);return b},toString:function(a){var c=this.n,b=this.d;if(isNaN(c)||isNaN(b))return"NaN";var d;a:{for(d=b;0===d%2;d/=2);for(;0===d%5;d/=5);if(1===d)d=0;else{for(var f=10%d,l=1;1!==f;l++)if(f=10*f%d,2E3<l){d=0;break a}d=l}}a:{f=1;l=
10;for(var k=d,t=1;0<k;l=l*l%b,k>>=1)k&1&&(t=t*l%b);l=t;for(k=0;300>k;k++){if(f===l){l=k;break a}f=10*f%b;l=10*l%b}l=0}f=0>this.s?"-":"";f+=c/b|0;(c=c%b*10)&&(f+=".");if(d){for(a=l;a--;)f+=c/b|0,c%=b,c*=10;f+="(";for(a=d;a--;)f+=c/b|0,c%=b,c*=10;f+=")"}else for(a=a||15;c&&a--;)f+=c/b|0,c%=b,c*=10;return f}};"function"===typeof define&&define.amd?define([],function(){return m}):"object"===typeof exports?(Object.defineProperty(m,"__esModule",{value:!0}),m["default"]=m,m.Fraction=m,module.exports=m):
z.Fraction=m})(this);
/**}}}*/


