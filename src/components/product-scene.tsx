"use client";
import {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Group, MathUtils } from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { useReducedMotion } from "motion/react";
import type { Product } from "@/domain/catalog";
import { ProductArt } from "./product-art";

class SceneBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
function Rounded({
  size,
  position = [0, 0, 0],
  color = "#8a8a8d",
  glass = false,
}: {
  size: [number, number, number];
  position?: [number, number, number];
  color?: string;
  glass?: boolean;
}) {
  const [width, height, depth] = size;
  const geometry = useMemo(
    () =>
      new RoundedBoxGeometry(
        width,
        height,
        depth,
        1,
        Math.min(width, height, depth) * 0.12,
      ),
    [width, height, depth],
  );
  useEffect(() => () => geometry.dispose(), [geometry]);
  return (
    <mesh position={position}>
      <primitive attach="geometry" object={geometry} />
      {glass ? (
        <meshStandardMaterial
          color="#f0f0f3"
          roughness={0.12}
          metalness={0.1}
          transparent
          opacity={0.88}
        />
      ) : (
        <meshStandardMaterial
          color={color}
          roughness={0.28}
          metalness={0.65}
        />
      )}
    </mesh>
  );
}
function ObjectModel({
  product,
  angle,
  reduced,
}: {
  product: Product;
  angle: number;
  reduced: boolean;
}) {
  const group = useRef<Group>(null);
  const { invalidate } = useThree();
  useEffect(() => {
    if (group.current && !reduced) group.current.rotation.y = angle + 0.15;
    invalidate();
  }, [angle, product.id, invalidate, reduced]);
  useFrame((_, delta) => {
    if (!group.current) return;
    const target = angle + 0.35;
    const remaining = target - group.current.rotation.y;
    group.current.rotation.y = reduced
      ? target
      : MathUtils.damp(
          group.current.rotation.y,
          target,
          9,
          Math.min(delta, 0.05),
        );
    if (Math.abs(remaining) > 0.0005) {
      invalidate();
    } else {
      group.current.rotation.y = target;
    }
  });
  const dark = "#171719";
  return (
    <group ref={group} rotation={[0.12, 0.35, -0.1]} position={[0, 0.1, 0]}>
      {product.category === "audio" ? (
        <>
          <mesh position={[0, 0.25, 0]}>
            <torusGeometry args={[1.1, 0.105, 20, 64, Math.PI]} />
            <meshStandardMaterial color={dark} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.26, 0]}>
            <torusGeometry args={[1.13, 0.04, 16, 64, Math.PI]} />
            <meshStandardMaterial
              color="#b5b5b9"
              metalness={0.8}
              roughness={0.22}
            />
          </mesh>
          {[-1, 1].map((side) => (
            <group key={side} position={[side * 1.06, -0.35, 0]}>
              <Rounded
                size={[0.09, 0.7, 0.1]}
                position={[0, 0.33, 0]}
                color="#b8b8bc"
              />
              <mesh rotation={[0, 0, Math.PI / 2]} scale={[1, 1.25, 1]}>
                <cylinderGeometry args={[0.44, 0.44, 0.26, 48]} />
                <meshStandardMaterial
                  color="#858589"
                  metalness={0.72}
                  roughness={0.27}
                />
              </mesh>
              <mesh
                position={[-side * 0.17, 0, 0]}
                rotation={[0, Math.PI / 2, 0]}
                scale={[1, 1.25, 1]}
              >
                <torusGeometry args={[0.32, 0.1, 16, 48]} />
                <meshStandardMaterial color={dark} roughness={0.82} />
              </mesh>
            </group>
          ))}
        </>
      ) : product.category === "storage" ? (
        <>
          <Rounded size={[1.5, 2.25, 0.27]} color="#b9b9bc" />
          <Rounded
            size={[0.32, 0.04, 0.09]}
            position={[0, -1.125, 0]}
            color="#111113"
          />
          <Rounded
            size={[0.018, 1.65, 0.01]}
            position={[-0.62, 0, 0.141]}
            color="#dedee0"
          />
        </>
      ) : product.category === "docks" ? (
        <>
          <Rounded size={[2.5, 0.52, 0.7]} color="#99999d" />
          {[-0.8, -0.3, 0.2, 0.7].map((x) => (
            <Rounded
              key={x}
              size={[0.28, 0.14, 0.025]}
              position={[x, 0, 0.36]}
              color="#111113"
            />
          ))}
          <Rounded
            size={[0.16, 0.12, 0.025]}
            position={[1.26, 0, 0]}
            color="#111113"
          />
        </>
      ) : product.category === "accessories" ? (
        <>
          <mesh scale={[0.8, 0.48, 1.1]}>
            <sphereGeometry args={[1, 48, 32]} />
            <meshStandardMaterial
              color="#858589"
              roughness={0.24}
              metalness={0.3}
            />
          </mesh>
          <Rounded
            size={[0.085, 0.055, 0.32]}
            position={[0, 0.47, -0.2]}
            color="#242426"
          />
        </>
      ) : (
        <>
          <Rounded size={[1.35, 1.6, 0.9]} color="#b9b9bc" />
          <Rounded
            size={[0.36, 0.12, 0.025]}
            position={[0, 0.15, 0.46]}
            color="#111113"
          />
          <Rounded
            size={[0.11, 0.5, 0.07]}
            position={[-0.22, 1.02, 0]}
            color="#ceced1"
          />
          <Rounded
            size={[0.11, 0.5, 0.07]}
            position={[0.22, 1.02, 0]}
            color="#ceced1"
          />
        </>
      )}
    </group>
  );
}
function ContextGuard({ onLost }: { onLost: () => void }) {
  const { gl } = useThree();
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => {
      event.preventDefault();
      onLost();
    };
    canvas.addEventListener("webglcontextlost", lost);
    return () => canvas.removeEventListener("webglcontextlost", lost);
  }, [gl, onLost]);
  return null;
}
export default function ProductScene({ product }: { product: Product }) {
  const root = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  const [failed, setFailed] = useState(false);
  const [angle, setAngle] = useState(0);
  const reduced = !!useReducedMotion();
  useEffect(() => {
    const element = root.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      (entries) => setInView(entries[0].isIntersecting && !document.hidden),
      { rootMargin: "800px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const fallback = (
    <div className="scene-fallback" data-scene="fallback">
      <ProductArt product={product} />
      <span>Catalog illustration · 3D unavailable</span>
    </div>
  );
  return (
    <div
      className="product-scene"
      ref={root}
      aria-label={`Interactive 3D illustration of ${product.name}`}
    >
      {failed ? (
        fallback
      ) : inView ? (
        <SceneBoundary fallback={fallback}>
          <Suspense fallback={<ProductArt product={product} />}>
            <Canvas
              frameloop="demand"
              dpr={1}
              camera={{ position: [0, 0.5, 5.4], fov: 38 }}
              gl={{
                antialias: true,
                alpha: true,
                powerPreference: "high-performance",
                precision: "mediump",
              }}
              onCreated={({ gl }) => {
                gl.domElement.dataset.scene = "ready";
              }}
              fallback={fallback}
            >
              <ContextGuard onLost={() => setFailed(true)} />
              <ambientLight intensity={1.8} />
              <directionalLight
                position={[3, 5, 4]}
                intensity={4}
                color="#ffffff"
              />
              <directionalLight
                position={[-4, 2, -2]}
                intensity={3}
                color="#dadade"
              />
              <ObjectModel product={product} angle={angle} reduced={reduced} />
              <Rounded
                size={[3.7, 0.13, 2]}
                position={[0, -1.27, 0]}
                color="#e5e5e7"
                glass
              />
            </Canvas>
          </Suspense>
        </SceneBoundary>
      ) : (
        fallback
      )}
      {!failed && (
        <div className="scene-controls" aria-label="3D view controls">
          <button
            aria-label="Rotate product left"
            onClick={() => setAngle((value) => value - Math.PI / 6)}
          >
            ↶
          </button>
          <button aria-label="Reset product view" onClick={() => setAngle(0)}>
            Reset view
          </button>
          <button
            aria-label="Rotate product right"
            onClick={() => setAngle((value) => value + Math.PI / 6)}
          >
            ↷
          </button>
        </div>
      )}
      <span className="scene-note">
        Original 3D illustration · proportions illustrative
      </span>
    </div>
  );
}
