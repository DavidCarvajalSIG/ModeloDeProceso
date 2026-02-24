"use client";

import { useMemo } from "react";
import { useGLTF } from "@react-three/drei";

type ModelProps = {
  url: string;
};

type MaterialLike = {
  clone: () => MaterialLike;
  toneMapped?: boolean;
  envMapIntensity?: number;
};

type MeshLike = {
  isMesh?: boolean;
  material?: MaterialLike | MaterialLike[];
};

type TraversableScene = {
  clone: (recursive?: boolean) => TraversableScene;
  traverse: (callback: (node: unknown) => void) => void;
};

export default function Model({ url }: ModelProps) {
  const { scene } = useGLTF(url) as { scene: TraversableScene };

  const tunedScene = useMemo(() => {
    const cloned = scene.clone(true);

    cloned.traverse((node: unknown) => {
      const mesh = node as MeshLike;
      if (!mesh.isMesh || !mesh.material) return;

      const materials = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];
      const localMaterials = materials.map((mat: MaterialLike) => mat.clone());

      mesh.material = Array.isArray(mesh.material)
        ? localMaterials
        : localMaterials[0];

      localMaterials.forEach((localMat) => {
        const tunableMat = localMat as MaterialLike;
        // Keep colors as authored in the model.
        tunableMat.toneMapped = false;
        if (typeof tunableMat.envMapIntensity === "number") {
          tunableMat.envMapIntensity = 0;
        }
      });
    });

    return cloned;
  }, [scene]);

  return <primitive object={tunedScene} />;
}

useGLTF.preload("/models/espiral.glb");
