// ═══ DESKTOP INPUT — Keyboard + Mouse ═══
// Requires game.js to be loaded first (defines K, M, JP, cj, ea, GOX, GOY, SC, C)

document.onkeydown=e=>{if(!K[e.code])JP[e.code]=1;K[e.code]=1;hasKeyboard=true;if(!['F11','F12'].includes(e.code))e.preventDefault()};
document.onkeyup=e=>{K[e.code]=0;if(!['F11','F12'].includes(e.code))e.preventDefault()};
C.onmousemove=e=>{M.x=(e.clientX-GOX)/SC;M.y=(e.clientY-GOY)/SC};
C.onmousedown=e=>{ea();M.down=true;M.click=true;e.preventDefault()};
C.onmouseup=e=>{M.down=false};
C.oncontextmenu=e=>e.preventDefault();
