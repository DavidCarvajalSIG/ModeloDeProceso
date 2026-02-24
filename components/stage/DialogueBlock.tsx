"use client";

import CharacterStepDialog, {
  type CharacterDialogStep,
} from "@/components/character-step-dialog/CharacterStepDialog";
import type { DialogueStepConfig } from "@/types/stage";
import styles from "./stage.module.css";

type DialogueBlockProps = {
  steps: DialogueStepConfig[];
  onComplete?: () => void;
};

export default function DialogueBlock({ steps, onComplete }: DialogueBlockProps) {
  const mappedSteps: CharacterDialogStep[] = steps.map((step) => ({
    text: step.text,
    imgSrc: step.imgSrc,
    imgAlt: step.imgAlt,
  }));

  return (
    <div className={styles.dialogueWrap}>
      <CharacterStepDialog
        steps={mappedSteps}
        size="compact"
        density="tight"
        onComplete={onComplete ? () => onComplete() : undefined}
      />
    </div>
  );
}
