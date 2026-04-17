import React, { useEffect, useMemo, useRef, useState } from "react";

const MAP = [
  "################",
  "#..............#",
  "#..##..........#",
  "#..............#",
  "#......####....#",
  "#..............#",
  "#...#..........#",
  "#...#....##....#",
  "#..............#",
  "#..............#",
  "#....###.......#",
  "#..............#",
  "#......#.......#",
  "#..............#",
  "#..............#",
  "################",
];

const INITIAL_ENEMIES = [
  { x: 8.5, y: 3.5, alive: true, cooldown: 0, hitFlash: 0 },
  { x: 12.5, y: 5.5, alive: true, cooldown: 0, hitFlash: 0 },
  { x: 10.5, y: 9.5, alive: true, cooldown: 0, hitFlash: 0 },
  { x: 4.5, y: 12.5, alive: true, cooldown: 0, hitFlash: 0 },
  { x: 13.5, y: 12.5, alive: true, cooldown: 0, hitFlash: 0 },
  { x: 7.5, y: 13.5, alive: true, cooldown: 0, hitFlash: 0 },
];

const WIDTH = 960;
const HEIGHT = 540;
const FOV = Math.PI / 3;
const HALF_FOV = FOV / 2;
const DEPTH = 20;
const MOVE_SPEED = 2.6;
const ROT_SPEED = 2.0;
const ENEMY_SPEED = 0.7;
const SHOOT_RANGE = 8;

function normalizeAngle(angle) {
  let result = angle;
  while (result < -Math.PI) result += Math.PI * 2;
  while (result > Math.PI) result -= Math.PI * 2;
  return result;
}

function isWallAt(x, y, map = MAP) {
  const mx = Math.floor(x);
  const my = Math.floor(y);
  if (my < 0 || my >= map.length || mx < 0 || mx >= map[0].length) return true;
  return map[my][mx] === "#";
}

function hasLineOfSight(x1, y1, x2, y2, map = MAP) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.floor(dist / 0.05));

  for (let i = 0; i <= steps; i += 1) {
    const t = i / steps;
    const x = x1 + dx * t;
    const y = y1 + dy * t;
    if (isWallAt(x, y, map)) return false;
  }

  return true;
}

function castRay(player, angle, map = MAP, depth = DEPTH) {
  const sin = Math.sin(angle);
  const cos = Math.cos(angle);

  for (let d = 0; d < depth; d += 0.02) {
    const x = player.x + cos * d;
    const y = player.y + sin * d;
    if (isWallAt(x, y, map)) {
      return { distance: d, hitX: x, hitY: y };
    }
  }

  return { distance: depth, hitX: player.x, hitY: player.y };
}

function cloneEnemies() {
  return INITIAL_ENEMIES.map((enemy) => ({ ...enemy }));
}

function runDiagnostics() {
  const tests = [
    {
      name: "normalizeAngle mantém valor no intervalo válido",
      pass: (() => {
        const normalized = normalizeAngle(Math.PI * 3);
        return normalized >= -Math.PI && normalized <= Math.PI;
      })(),
    },
    {
      name: "parede externa é bloqueada",
      pass: isWallAt(0, 0) === true,
    },
    {
      name: "área interna livre não é parede",
      pass: isWallAt(1.5, 1.5) === false,
    },
    {
      name: "raycast encontra parede à frente",
      pass: castRay({ x: 2.5, y: 2.5 }, 0).distance > 0,
    },
    {
      name: "linha de visão livre funciona",
      pass: hasLineOfSight(2.5, 2.5, 5.5, 2.5) === true,
    },
    {
      name: "linha de visão bloqueada por parede funciona",
      pass: hasLineOfSight(2.5, 2.5, 3.5, 7.5) === false,
    },
  ];

  return {
    total: tests.length,
    passed: tests.filter((test) => test.pass).length,
    tests,
  };
}

export default function DoomStyle3DGame() {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const keysRef = useRef({});
  const gameRef = useRef(null);
  const lastMouseXRef = useRef(null);
  const isHoveringCanvasRef = useRef(false);

  const diagnostics = useMemo(() => runDiagnostics(), []);

  const [hud, setHud] = useState({
    health: 100,
    ammo: 30,
    enemies: INITIAL_ENEMIES.length,
    score: 0,
    message: "Clique em iniciar. Mova o mouse sobre o jogo para mirar.",
    gameOver: false,
    victory: false,
    started: false,
    aimingMode: "mouse no canvas",
  });

  const syncHud = () => {
    const state = gameRef.current;
    if (!state) return;

    setHud({
      health: Math.max(0, Math.floor(state.player.health)),
      ammo: state.player.ammo,
      enemies: state.enemies.filter((enemy) => enemy.alive).length,
      score: state.player.score,
      message: state.message,
      gameOver: state.gameOver,
      victory: state.victory,
      started: state.started,
      aimingMode: "mouse no canvas",
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return undefined;

    canvas.width = WIDTH;
    canvas.height = HEIGHT;

    gameRef.current = {
      player: {
        x: 2.5,
        y: 2.5,
        angle: 0,
        health: 100,
        ammo: 30,
        score: 0,
      },
      enemies: cloneEnemies(),
      bulletsFX: [],
      lastTime: 0,
      started: false,
      gameOver: false,
      victory: false,
      message: "Clique em iniciar. Mova o mouse sobre o jogo para mirar.",
    };

    const tryMove = (dx, dy) => {
      const state = gameRef.current;
      if (!state) return;

      const nx = state.player.x + dx;
      const ny = state.player.y + dy;

      if (!isWallAt(nx, state.player.y)) state.player.x = nx;
      if (!isWallAt(state.player.x, ny)) state.player.y = ny;
    };

    const shoot = () => {
      const state = gameRef.current;
      if (!state || !state.started || state.gameOver || state.victory) return;

      if (state.player.ammo <= 0) {
        state.message = "Sem munição!";
        syncHud();
        return;
      }

      state.player.ammo -= 1;
      state.bulletsFX.push({ timer: 0.08 });

      let hitEnemy = null;
      let bestDist = Infinity;

      state.enemies.forEach((enemy) => {
        if (!enemy.alive) return;

        const dx = enemy.x - state.player.x;
        const dy = enemy.y - state.player.y;
        const dist = Math.hypot(dx, dy);
        if (dist > SHOOT_RANGE) return;
        if (!hasLineOfSight(state.player.x, state.player.y, enemy.x, enemy.y)) return;

        const angleToEnemy = normalizeAngle(Math.atan2(dy, dx) - state.player.angle);
        if (Math.abs(angleToEnemy) < 0.12 && dist < bestDist) {
          bestDist = dist;
          hitEnemy = enemy;
        }
      });

      if (hitEnemy) {
        hitEnemy.alive = false;
        hitEnemy.hitFlash = 0.2;
        state.player.score += 100;
        state.message = "Inimigo abatido!";
      } else {
        state.message = "Errou o tiro";
      }

      if (state.enemies.every((enemy) => !enemy.alive)) {
        state.victory = true;
        state.message = "Você venceu! Todos os inimigos foram derrotados.";
      }

      syncHud();
    };

    const drawBackground = () => {
      const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT / 2);
      sky.addColorStop(0, "#5b1e1e");
      sky.addColorStop(1, "#2a0f0f");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, WIDTH, HEIGHT / 2);

      const floor = ctx.createLinearGradient(0, HEIGHT / 2, 0, HEIGHT);
      floor.addColorStop(0, "#1f1f1f");
      floor.addColorStop(1, "#080808");
      ctx.fillStyle = floor;
      ctx.fillRect(0, HEIGHT / 2, WIDTH, HEIGHT / 2);
    };

    const drawWalls = () => {
      const state = gameRef.current;
      if (!state) return;

      for (let x = 0; x < WIDTH; x += 1) {
        const rayAngle = state.player.angle - HALF_FOV + (x / WIDTH) * FOV;
        const ray = castRay(state.player, rayAngle);
        const correctedDist = ray.distance * Math.cos(rayAngle - state.player.angle);
        const wallHeight = Math.min(HEIGHT, HEIGHT / Math.max(correctedDist, 0.0001));
        const shade = Math.max(20, 255 - correctedDist * 28);

        ctx.fillStyle = `rgb(${shade}, ${shade * 0.35}, ${shade * 0.35})`;
        ctx.fillRect(x, HEIGHT / 2 - wallHeight / 2, 1, wallHeight);
      }
    };

    const drawEnemies = () => {
      const state = gameRef.current;
      if (!state) return;

      const sprites = [];
      state.enemies.forEach((enemy) => {
        if (!enemy.alive) return;

        const dx = enemy.x - state.player.x;
        const dy = enemy.y - state.player.y;
        const dist = Math.hypot(dx, dy);
        const angleToEnemy = normalizeAngle(Math.atan2(dy, dx) - state.player.angle);

        if (Math.abs(angleToEnemy) < HALF_FOV + 0.25 && hasLineOfSight(state.player.x, state.player.y, enemy.x, enemy.y)) {
          sprites.push({ enemy, dist, angle: angleToEnemy });
        }
      });

      sprites.sort((a, b) => b.dist - a.dist);

      sprites.forEach(({ enemy, dist, angle }) => {
        const size = Math.min(220, 340 / dist);
        const screenX = WIDTH / 2 + (angle / HALF_FOV) * (WIDTH / 2) - size / 2;
        const screenY = HEIGHT / 2 - size / 2 + 18;

        const centerRay = castRay(state.player, state.player.angle + angle);
        if (centerRay.distance < dist) return;

        ctx.fillStyle = enemy.hitFlash > 0 ? "#fff176" : "#88ff88";
        ctx.fillRect(screenX, screenY, size, size * 0.9);

        ctx.fillStyle = "#102010";
        ctx.fillRect(screenX + size * 0.18, screenY + size * 0.18, size * 0.18, size * 0.18);
        ctx.fillRect(screenX + size * 0.64, screenY + size * 0.18, size * 0.18, size * 0.18);

        ctx.fillStyle = "#7a1f1f";
        ctx.fillRect(screenX + size * 0.25, screenY + size * 0.62, size * 0.5, size * 0.12);
      });
    };

    const drawWeapon = () => {
      const state = gameRef.current;
      if (!state) return;

      const recoil = state.bulletsFX.length > 0 ? 14 : 0;
      const baseY = HEIGHT - 120 + recoil;

      ctx.fillStyle = "#444";
      ctx.fillRect(WIDTH / 2 - 80, baseY, 160, 90);
      ctx.fillStyle = "#222";
      ctx.fillRect(WIDTH / 2 - 22, baseY - 90, 44, 110);
      ctx.fillStyle = "#111";
      ctx.fillRect(WIDTH / 2 - 10, baseY - 130, 20, 45);
    };

    const drawCrosshair = () => {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(WIDTH / 2 - 12, HEIGHT / 2);
      ctx.lineTo(WIDTH / 2 + 12, HEIGHT / 2);
      ctx.moveTo(WIDTH / 2, HEIGHT / 2 - 12);
      ctx.lineTo(WIDTH / 2, HEIGHT / 2 + 12);
      ctx.stroke();
    };

    const drawMiniMap = () => {
      const state = gameRef.current;
      if (!state) return;

      const scale = 10;
      const mapX = 16;
      const mapY = 16;

      ctx.save();
      ctx.globalAlpha = 0.9;
      for (let y = 0; y < MAP.length; y += 1) {
        for (let x = 0; x < MAP[y].length; x += 1) {
          ctx.fillStyle = MAP[y][x] === "#" ? "#6b1d1d" : "#111";
          ctx.fillRect(mapX + x * scale, mapY + y * scale, scale - 1, scale - 1);
        }
      }

      state.enemies.forEach((enemy) => {
        if (!enemy.alive) return;
        ctx.fillStyle = "#00ff66";
        ctx.fillRect(mapX + enemy.x * scale - 2, mapY + enemy.y * scale - 2, 4, 4);
      });

      ctx.fillStyle = "#00d4ff";
      ctx.beginPath();
      ctx.arc(mapX + state.player.x * scale, mapY + state.player.y * scale, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#00d4ff";
      ctx.beginPath();
      ctx.moveTo(mapX + state.player.x * scale, mapY + state.player.y * scale);
      ctx.lineTo(
        mapX + (state.player.x + Math.cos(state.player.angle) * 1.2) * scale,
        mapY + (state.player.y + Math.sin(state.player.angle) * 1.2) * scale
      );
      ctx.stroke();
      ctx.restore();
    };

    const renderOverlay = () => {
      const state = gameRef.current;
      if (!state) return;

      if (!state.started || state.gameOver || state.victory) {
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        ctx.fillStyle = "#fff";
        ctx.textAlign = "center";
        ctx.font = "bold 34px Arial";
        ctx.fillText(
          state.victory ? "VOCÊ VENCEU" : state.gameOver ? "FIM DE JOGO" : "DOOM-STYLE REACT",
          WIDTH / 2,
          HEIGHT / 2 - 40
        );
        ctx.font = "20px Arial";
        ctx.fillText(state.message, WIDTH / 2, HEIGHT / 2 + 10);
        ctx.fillText("WASD para mover | mouse sobre o canvas ou ← → para girar | clique para atirar", WIDTH / 2, HEIGHT / 2 + 50);
      }
    };

    const update = (dt) => {
      const state = gameRef.current;
      if (!state || !state.started || state.gameOver || state.victory) return;

      if (keysRef.current.ArrowLeft) state.player.angle -= ROT_SPEED * dt;
      if (keysRef.current.ArrowRight) state.player.angle += ROT_SPEED * dt;

      const forwardX = Math.cos(state.player.angle);
      const forwardY = Math.sin(state.player.angle);
      const sideX = Math.cos(state.player.angle + Math.PI / 2);
      const sideY = Math.sin(state.player.angle + Math.PI / 2);

      if (keysRef.current.w || keysRef.current.W) tryMove(forwardX * MOVE_SPEED * dt, forwardY * MOVE_SPEED * dt);
      if (keysRef.current.s || keysRef.current.S) tryMove(-forwardX * MOVE_SPEED * dt, -forwardY * MOVE_SPEED * dt);
      if (keysRef.current.a || keysRef.current.A) tryMove(-sideX * MOVE_SPEED * dt, -sideY * MOVE_SPEED * dt);
      if (keysRef.current.d || keysRef.current.D) tryMove(sideX * MOVE_SPEED * dt, sideY * MOVE_SPEED * dt);

      state.enemies.forEach((enemy) => {
        if (!enemy.alive) return;

        enemy.cooldown = Math.max(0, enemy.cooldown - dt);
        enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);

        const dx = state.player.x - enemy.x;
        const dy = state.player.y - enemy.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 1.4 && hasLineOfSight(enemy.x, enemy.y, state.player.x, state.player.y)) {
          const stepX = (dx / dist) * ENEMY_SPEED * dt;
          const stepY = (dy / dist) * ENEMY_SPEED * dt;
          if (!isWallAt(enemy.x + stepX, enemy.y)) enemy.x += stepX;
          if (!isWallAt(enemy.x, enemy.y + stepY)) enemy.y += stepY;
        }

        if (dist <= 1.8 && enemy.cooldown <= 0) {
          enemy.cooldown = 1.0;
          state.player.health -= 12;
          state.message = "Você foi atingido!";
          if (state.player.health <= 0) {
            state.player.health = 0;
            state.gameOver = true;
            state.message = "Fim de jogo! Pressione reiniciar.";
          }
        }
      });

      state.bulletsFX = state.bulletsFX.filter((fx) => {
        const nextTimer = fx.timer - dt;
        return nextTimer > 0;
      }).map((fx) => ({ ...fx, timer: fx.timer - dt }));

      syncHud();
    };

    const render = () => {
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      drawBackground();
      drawWalls();
      drawEnemies();
      drawCrosshair();
      drawWeapon();
      drawMiniMap();
      renderOverlay();
    };

    const loop = (time) => {
      const state = gameRef.current;
      if (!state) return;

      const dt = Math.min((time - state.lastTime) / 1000 || 0, 0.033);
      state.lastTime = time;
      update(dt);
      render();
      animationRef.current = window.requestAnimationFrame(loop);
    };

    const handleKeyDown = (event) => {
      keysRef.current[event.key] = true;
      if (event.key === " ") {
        event.preventDefault();
        shoot();
      }
    };

    const handleKeyUp = (event) => {
      keysRef.current[event.key] = false;
    };

    const handleMouseMove = (event) => {
      const state = gameRef.current;
      if (!state || !state.started || state.gameOver || state.victory || !isHoveringCanvasRef.current) return;

      const currentX = event.clientX;
      if (lastMouseXRef.current === null) {
        lastMouseXRef.current = currentX;
        return;
      }

      const deltaX = currentX - lastMouseXRef.current;
      lastMouseXRef.current = currentX;
      state.player.angle += deltaX * 0.005;
    };

    const handleMouseEnter = (event) => {
      isHoveringCanvasRef.current = true;
      lastMouseXRef.current = event.clientX;
      const state = gameRef.current;
      if (!state) return;
      state.message = state.started ? "Mira ativa no canvas." : state.message;
      syncHud();
    };

    const handleMouseLeave = () => {
      isHoveringCanvasRef.current = false;
      lastMouseXRef.current = null;
    };

    const handleMouseDown = () => {
      shoot();
      canvas.focus();
    };

    const resetGame = () => {
      gameRef.current = {
        player: {
          x: 2.5,
          y: 2.5,
          angle: 0,
          health: 100,
          ammo: 30,
          score: 0,
        },
        enemies: cloneEnemies(),
        bulletsFX: [],
        lastTime: 0,
        started: true,
        gameOver: false,
        victory: false,
        message: "Jogo iniciado! Mova o mouse sobre o canvas para mirar.",
      };
      syncHud();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseenter", handleMouseEnter);
    canvas.addEventListener("mouseleave", handleMouseLeave);
    canvas.addEventListener("mousedown", handleMouseDown);

    canvas.tabIndex = 0;
    syncHud();
    animationRef.current = window.requestAnimationFrame(loop);

    const startButton = document.getElementById("doom-react-start-btn");
    const restartButton = document.getElementById("doom-react-restart-btn");

    const onStart = () => resetGame();
    const onRestart = () => resetGame();

    startButton?.addEventListener("click", onStart);
    restartButton?.addEventListener("click", onRestart);

    return () => {
      if (animationRef.current) window.cancelAnimationFrame(animationRef.current);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseenter", handleMouseEnter);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      canvas.removeEventListener("mousedown", handleMouseDown);
      startButton?.removeEventListener("click", onStart);
      restartButton?.removeEventListener("click", onRestart);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 gap-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-[320px_1fr] gap-4 items-start">
        <div className="bg-zinc-950 border border-red-900 rounded-3xl p-5 shadow-2xl">
          <h1 className="text-3xl font-black text-red-500 mb-3">DOOM STYLE 3D</h1>
          <p className="text-zinc-300 text-sm mb-4">
            FPS em React com canvas e raycasting simples, ajustado para rodar sem pointer lock.
          </p>

          <div className="space-y-3 mb-4">
            <div className="bg-zinc-900 rounded-2xl p-3"><strong>Vida:</strong> {hud.health}</div>
            <div className="bg-zinc-900 rounded-2xl p-3"><strong>Munição:</strong> {hud.ammo}</div>
            <div className="bg-zinc-900 rounded-2xl p-3"><strong>Inimigos:</strong> {hud.enemies}</div>
            <div className="bg-zinc-900 rounded-2xl p-3"><strong>Pontos:</strong> {hud.score}</div>
          </div>

          <div className="bg-zinc-900 rounded-2xl p-4 text-sm text-zinc-300 space-y-1 mb-4">
            <div><strong>Controles:</strong></div>
            <div>WASD = mover</div>
            <div>Mouse dentro do canvas ou ← → = girar</div>
            <div>Clique ou espaço = atirar</div>
          </div>

          <div className="bg-zinc-900 rounded-2xl p-4 text-xs text-zinc-300 mb-4">
            <div><strong>Diagnóstico interno:</strong> {diagnostics.passed}/{diagnostics.total} testes OK</div>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              {diagnostics.tests.map((test) => (
                <li key={test.name} className={test.pass ? "text-emerald-400" : "text-red-400"}>
                  {test.pass ? "OK" : "FALHOU"} — {test.name}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-3 mb-3">
            <button
              id="doom-react-start-btn"
              className="flex-1 rounded-2xl bg-red-700 hover:bg-red-600 px-4 py-3 font-bold transition"
            >
              Iniciar
            </button>
            <button
              id="doom-react-restart-btn"
              className="flex-1 rounded-2xl bg-zinc-700 hover:bg-zinc-600 px-4 py-3 font-bold transition"
            >
              Reiniciar
            </button>
          </div>

          <div className="text-xs text-zinc-400 leading-5">
            {hud.victory
              ? "Status: vitória"
              : hud.gameOver
                ? "Status: derrotado"
                : hud.started
                  ? "Status: em combate"
                  : "Status: aguardando início"}
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-3 shadow-2xl">
          <canvas
            ref={canvasRef}
            className="w-full rounded-2xl border border-red-950 bg-black cursor-crosshair outline-none"
            style={{ aspectRatio: "16 / 9" }}
          />
          <div className="mt-3 text-center text-sm text-zinc-300">{hud.message}</div>
        </div>
      </div>
    </div>
  );
}
