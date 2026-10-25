
import {
  Component,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import {
  Float,
  Line,
  Sparkles,
} from "@react-three/drei";
import * as THREE from "three";

const CYAN = "#22d3ee";
const INDIGO = "#818cf8";

const ROUTES: [number, number][][] = [
  [[-0.6, -0.3], [-1.4, -0.3], [-1.8, -0.7], [-2.6, -0.7]],
  [[-0.6, 0.3], [-1.2, 0.3], [-1.6, 0.8], [-2.6, 0.8]],
  [[0.6, -0.3], [1.3, -0.3], [1.7, -0.9], [2.6, -0.9]],
  [[0.6, 0.3], [1.2, 0.3], [1.7, 0.7], [2.6, 0.7]],
  [[-0.3, -0.6], [-0.3, -1.1], [0.2, -1.4], [0.2, -1.9]],
  [[0.3, 0.6], [0.3, 1.1], [-0.2, 1.4], [-0.2, 1.9]],
];

function Pulse({
  points,
  speed,
  offset,
  animate,
}: {
  points: THREE.Vector3[];
  speed: number;
  offset: number;
  animate: boolean;
}) {
  const ref = useRef<THREE.Mesh>(null);

  const curve = useMemo(
    () => new THREE.CatmullRomCurve3(points, false, "chordal"),
    [points]
  );

  useFrame(({ clock }) => {
    if (!ref.current || !animate) return;

    const t = (clock.elapsedTime * speed + offset) % 1;
    ref.current.position.copy(curve.getPoint(t));
  });

  return (
    <mesh ref={ref} position={curve.getPoint(offset)}>
      <sphereGeometry args={[0.055, 12, 12]} />
      <meshBasicMaterial color="#e0f7ff" />
    </mesh>
  );
}

function Board({ animate }: { animate: boolean }) {
  const chipGlow = useRef<THREE.MeshStandardMaterial>(null);

  const routes = useMemo(
    () =>
      ROUTES.map((route) =>
        route.map(
          ([x, z]) => new THREE.Vector3(x, 0.09, z)
        )
      ),
    []
  );

  const curves = useMemo(
    () =>
      routes.map((points) =>
        new THREE.CatmullRomCurve3(
          points,
          false,
          "chordal"
        ).getPoints(48)
      ),
    [routes]
  );

  useFrame(({ clock }) => {
    if (chipGlow.current && animate) {
      chipGlow.current.emissiveIntensity =
        0.55 + Math.sin(clock.elapsedTime * 2) * 0.25;
    }
  });

  const legs = useMemo(() => {
    const result: [number, number, number, number][] = [];

    for (let i = 0; i < 8; i++) {
      const p = -0.48 + i * 0.137;

      result.push(
        [p, 0.1, 0.62, 0],
        [p, 0.1, -0.62, 0],
        [0.62, 0.1, p, 1],
        [-0.62, 0.1, p, 1]
      );
    }

    return result;
  }, []);

  return (
    <group rotation={[0.35, -0.5, 0]}>
      {/* PCB base */}
      <mesh>
        <boxGeometry args={[6, 0.12, 4.4]} />
        <meshStandardMaterial
          color="#0d1424"
          metalness={0.6}
          roughness={0.45}
        />
      </mesh>

      <lineSegments>
        <edgesGeometry
          args={[new THREE.BoxGeometry(6, 0.12, 4.4)]}
        />
        <lineBasicMaterial
          color={INDIGO}
          transparent
          opacity={0.65}
        />
      </lineSegments>

      {/* Main IC */}
      <mesh position={[0, 0.17, 0]}>
        <boxGeometry args={[1, 0.2, 1]} />
        <meshStandardMaterial
          ref={chipGlow}
          color="#10192e"
          emissive={CYAN}
          emissiveIntensity={0.55}
          metalness={0.8}
          roughness={0.3}
        />
      </mesh>

      {/* IC indicator */}
      <mesh position={[-0.3, 0.28, -0.3]}>
        <cylinderGeometry args={[0.05, 0.05, 0.02, 16]} />
        <meshBasicMaterial color={CYAN} />
      </mesh>

      {/* IC pins */}
      {legs.map(([x, y, z, rot], index) => (
        <mesh
          key={index}
          position={[rot ? z : x, y, rot ? x : z]}
        >
          <boxGeometry
            args={
              rot
                ? [0.18, 0.04, 0.07]
                : [0.07, 0.04, 0.18]
            }
          />
          <meshStandardMaterial
            color="#9fb4d6"
            metalness={0.9}
            roughness={0.25}
          />
        </mesh>
      ))}

      {/* Copper traces, contact pads and signal pulses */}
      {curves.map((points, index) => (
        <group key={index}>
          <Line
            points={points}
            color={CYAN}
            lineWidth={1.6}
            transparent
            opacity={0.8}
          />

          <mesh position={points[points.length - 1]}>
            <cylinderGeometry
              args={[0.1, 0.1, 0.03, 20]}
            />
            <meshStandardMaterial
              color="#facc15"
              metalness={1}
              roughness={0.2}
              emissive="#a16207"
              emissiveIntensity={0.4}
            />
          </mesh>

          <Pulse
            points={routes[index]}
            speed={0.16 + (index % 3) * 0.04}
            offset={(index * 0.17) % 1}
            animate={animate}
          />
        </group>
      ))}
    </group>
  );
}

function Orbit({
  radius,
  tilt,
  speed,
  nodes,
  animate,
}: {
  radius: number;
  tilt: number;
  speed: number;
  nodes: number;
  animate: boolean;
}) {
  const group = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (group.current && animate) {
      group.current.rotation.y += delta * speed;
    }
  });

  return (
    <group rotation={[tilt, 0, 0]}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry
          args={[radius, 0.008, 8, 128]}
        />
        <meshBasicMaterial
          color={INDIGO}
          transparent
          opacity={0.45}
        />
      </mesh>

      <group ref={group}>
        {Array.from({ length: nodes }).map((_, index) => {
          const angle = (index / nodes) * Math.PI * 2;

          return (
            <mesh
              key={index}
              position={[
                Math.cos(angle) * radius,
                0,
                Math.sin(angle) * radius,
              ]}
            >
              <octahedronGeometry args={[0.1, 0]} />
              <meshStandardMaterial
                color={index % 2 ? CYAN : INDIGO}
                emissive={index % 2 ? CYAN : INDIGO}
                emissiveIntensity={0.9}
              />
            </mesh>
          );
        })}
      </group>
    </group>
  );
}

function Rig({
  animate,
  children,
}: {
  animate: boolean;
  children: ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);

  useFrame(({ pointer }) => {
    if (!ref.current || !animate) return;

    ref.current.rotation.y = THREE.MathUtils.lerp(
      ref.current.rotation.y,
      pointer.x * 0.25,
      0.05
    );

    ref.current.rotation.x = THREE.MathUtils.lerp(
      ref.current.rotation.x,
      -pointer.y * 0.12,
      0.05
    );
  });

  return <group ref={ref}>{children}</group>;
}

class SceneBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed
      ? this.props.fallback
      : this.props.children;
  }
}

function hasWebGL() {
  try {
    const canvas = document.createElement("canvas");

    return Boolean(
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl")
    );
  } catch {
    return false;
  }
}

export default function Hero3D({
  reducedMotion = false,
  fallback,
}: {
  reducedMotion?: boolean;
  fallback: ReactNode;
}) {
  const animate = !reducedMotion;

  if (
    typeof document !== "undefined" &&
    !hasWebGL()
  ) {
    return <>{fallback}</>;
  }

  return (
    <SceneBoundary fallback={fallback}>
      <Canvas
        dpr={[1, 1.5]}
        camera={{
          position: [0, 4.5, 10.5],
          fov: 45,
          near: 0.1,
          far: 100,
        }}
        frameloop={animate ? "always" : "demand"}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        style={{
          width: "100%",
          height: "100%",
        }}
        aria-hidden
      >
        <ambientLight intensity={0.65} />

        <pointLight
          position={[4, 5, 4]}
          intensity={35}
          color={CYAN}
        />

        <pointLight
          position={[-5, 2, -3]}
          intensity={25}
          color={INDIGO}
        />

        {/* Keep the PCB and its orbit inside one scaled group */}
        <Rig animate={animate}>
          <group scale={0.78}>
            <Float
              speed={animate ? 1.2 : 0}
              rotationIntensity={0.12}
              floatIntensity={0.25}
            >
              <Board animate={animate} />

              <Orbit
                radius={3.9}
                tilt={0.5}
                speed={0.35}
                nodes={5}
                animate={animate}
              />

              <Orbit
                radius={4.6}
                tilt={-0.35}
                speed={-0.22}
                nodes={4}
                animate={animate}
              />
            </Float>
          </group>
        </Rig>

        {animate && (
          <Sparkles
            count={60}
            scale={[10, 6, 6]}
            size={2}
            speed={0.35}
            color={CYAN}
            opacity={0.6}
          />
        )}
      </Canvas>
    </SceneBoundary>
  );
}
