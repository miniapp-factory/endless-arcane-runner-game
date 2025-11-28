"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type Obstacle = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gravity, setGravity] = useState(1); // 1 = floor, -1 = ceiling
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [speed, setSpeed] = useState(0.25);

  // Handle click to flip gravity
  useEffect(() => {
    const handleClick = () => setGravity((g) => -g);
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let lastTime = performance.now();
    let obstacleTimer = 0;
    let obstacleInterval = 600; // ms

    const cubeSize = 30;
    const cubeY = () => (gravity === 1 ? 400 - cubeSize - 10 : 10);

    const update = (dt: number) => {
      if (gameOver) return;
      // Move obstacles
      setObstacles((prev) =>
        prev
          .map((o) => ({ ...o, x: o.x - speed }))
          .filter((o) => o.x + o.width > 0)
      );

      // Generate new obstacles
      obstacleTimer += dt;
      if (obstacleTimer > obstacleInterval) {
        obstacleTimer = 0;
        const isTop = Math.random() < 0.5;
        const obstacle1: Obstacle = {
          x: canvas.width,
          y: isTop ? 10 : 400 - 10 - 20,
          width: 20,
          height: 20,
        };
        const obstacle2: Obstacle = {
          x: canvas.width,
          y: isTop ? 400 - 10 - 20 : 10,
          width: 20,
          height: 20,
        };
        setObstacles((prev) => [...prev, obstacle1, obstacle2]);
      }

      // Increase speed over time
      setSpeed((s) => s + dt * 0.00005);

      // Update score
      setScore((s) => s + dt * 0.01);
    };

    const draw = () => {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw cube
      ctx.fillStyle = "#0ff";
      ctx.fillRect(
        canvas.width / 4,
        cubeY(),
        cubeSize,
        cubeSize
      );

      // Draw obstacles
      ctx.fillStyle = "#f0f";
      obstacles.forEach((o) => {
        ctx.fillRect(o.x, o.y, o.width, o.height);
      });

      // Draw score
      ctx.fillStyle = "#fff";
      ctx.font = "20px monospace";
      ctx.fillText(`Score: ${Math.floor(score)}`, 10, 30);
    };

    const loop = (time: number) => {
      const dt = time - lastTime;
      lastTime = time;
      if (!gameOver) {
        update(dt);
        draw();
        requestAnimationFrame(loop);
      }
    };

    requestAnimationFrame(loop);

    // Collision detection
    const checkCollision = () => {
      const cubeRect = {
        x: canvas.width / 4,
        y: cubeY(),
        width: cubeSize,
        height: cubeSize,
      };
      for (const o of obstacles) {
        if (
          cubeRect.x < o.x + o.width &&
          cubeRect.x + cubeRect.width > o.x &&
          cubeRect.y < o.y + o.height &&
          cubeRect.y + cubeRect.height > o.y
        ) {
          setGameOver(true);
          setObstacles([]);
          return;
        }
      }
    };

    const collisionLoop = () => {
      if (!gameOver) {
        checkCollision();
        setTimeout(collisionLoop, 16);
      }
    };
    collisionLoop();

    return () => {
      // Cleanup
    };
  }, [gravity, obstacles, gameOver, speed, score]);

  const restart = () => {
    setScore(0);
    setGameOver(false);
    setGravity(1);
    setObstacles([]);
    setSpeed(0.25);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
      <canvas style={{ border: "8px solid", borderColor: "#0ff", boxShadow: "0 0 20px 5px #0ff" }}
        ref={canvasRef}
        width={800}
        height={400}
        className="block"
      />
      {gameOver && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70">
          <h1 className="text-4xl text-white mb-4">Game Over</h1>
          <p className="text-white mb-8">Score: {Math.floor(score)}</p>
          <Button onClick={restart}>Restart</Button>
        </div>
      )}
    </div>
  );
}
