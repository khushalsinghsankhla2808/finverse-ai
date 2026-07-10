import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';

interface FloatingTextProps {
  text: string;
  position: [number, number, number];
  speed?: number;
}

const FloatingText: React.FC<FloatingTextProps> = ({ text, position, speed = 1 }) => {
  const ref = useRef<THREE.Mesh>(null);
  const initialY = position[1];

  useFrame(({ clock }) => {
    if (ref.current) {
      const elapsedTime = clock.getElapsedTime();
      // Bobbing animation
      ref.current.position.y = initialY + Math.sin(elapsedTime * speed) * 0.12;
    }
  });

  return (
    <Text
      ref={ref}
      position={position}
      fontSize={0.35}
      color="#A855F7" // var(--purple-light)
      anchorX="center"
      anchorY="middle"
    >
      {text}
    </Text>
  );
};

export const FinanceGlobe: React.FC = () => {
  return (
    <div className="w-full h-[300px] relative flex items-center justify-center select-none">
      <Canvas
        camera={{ position: [0, 0, 4.5], fov: 60 }}
        style={{ background: 'transparent', width: '100%', height: '100%' }}
        frameloop="always" // Rotate animation depends on always render loop
      >
        <ambientLight color="#7C3AED" intensity={0.7} />
        <pointLight color="#06B6D4" intensity={2.0} position={[5, 3, 5]} />
        <pointLight color="#7C3AED" intensity={1.5} position={[-5, -3, -5]} />
        
        <OrbitControls
          enablePan={false}
          enableZoom={false}
          autoRotate={true}
          autoRotateSpeed={0.6}
        />

        <group>
          {/* Main sphere */}
          <mesh>
            <sphereGeometry args={[1.7, 64, 64]} />
            <meshStandardMaterial
              color="#0D1530" // var(--bg-surface)
              roughness={0.7}
              metalness={0.3}
            />
          </mesh>

          {/* Wireframe overlay */}
          <mesh>
            <sphereGeometry args={[1.72, 32, 32]} />
            <meshBasicMaterial
              color="#7C3AED" // var(--purple-primary)
              wireframe={true}
              transparent={true}
              opacity={0.15}
            />
          </mesh>

          {/* Floating symbols */}
          <FloatingText text="$" position={[2.0, 0.4, 0]} speed={1.3} />
          <FloatingText text="€" position={[-1.7, -0.8, 1.0]} speed={1.0} />
          <FloatingText text="₿" position={[0.4, 1.4, -1.3]} speed={1.6} />
        </group>

        {/* Purple glow ring below the globe */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.9, 0]}>
          <ringGeometry args={[1.0, 1.6, 64]} />
          <meshBasicMaterial
            color="#7C3AED"
            transparent={true}
            opacity={0.2}
            side={THREE.DoubleSide}
          />
        </mesh>
      </Canvas>
    </div>
  );
};

export default FinanceGlobe;
