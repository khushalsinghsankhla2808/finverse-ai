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
      color="#0466c8"
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
        frameloop="always"
      >
        <ambientLight color="#5aa5f2" intensity={0.9} />
        <pointLight color="#1f7bdc" intensity={2.5} position={[5, 3, 5]} />
        <pointLight color="#5aa5f2" intensity={1.8} position={[-5, -3, -5]} />
        
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
              color="#0466c8"
              roughness={0.5}
              metalness={0.4}
            />
          </mesh>

          {/* Wireframe overlay */}
          <mesh>
            <sphereGeometry args={[1.72, 32, 32]} />
            <meshBasicMaterial
              color="#5aa5f2"
              wireframe={true}
              transparent={true}
              opacity={0.45}
            />
          </mesh>

          {/* Floating symbols */}
          <FloatingText text="₹" position={[2.0, 0.4, 0]} speed={1.3} />
          <FloatingText text="$" position={[-1.7, -0.8, 1.0]} speed={1.0} />
          <FloatingText text="€" position={[0.4, 1.4, -1.3]} speed={1.6} />
        </group>

        {/* Glow ring below the globe */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.9, 0]}>
          <ringGeometry args={[1.0, 1.6, 64]} />
          <meshBasicMaterial
            color="#5aa5f2"
            transparent={true}
            opacity={0.35}
            side={THREE.DoubleSide}
          />
        </mesh>
      </Canvas>
    </div>
  );
};

export default FinanceGlobe;
