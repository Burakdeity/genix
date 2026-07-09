"use client";

import { Slider } from "@/components/ui/slider";

interface TemperatureSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export function TemperatureSlider({ value, onChange }: TemperatureSliderProps) {
  return (
    <div className="space-y-3">
      <Slider
        value={[value]}
        min={0}
        max={2}
        step={0.1}
        onValueChange={(nextValue) => {
          const temperature = Array.isArray(nextValue) ? nextValue[0] : nextValue;
          onChange(temperature);
        }}
        className="[&_[data-slot=slider-track]]:h-2 [&_[data-slot=slider-track]]:temp-slider-track [&_[data-slot=slider-range]]:bg-transparent [&_[data-slot=slider-thumb]]:size-4 [&_[data-slot=slider-thumb]]:border-2 [&_[data-slot=slider-thumb]]:border-white [&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-thumb]]:shadow-[0_0_12px_rgba(255,255,255,0.5)]"
      />
    </div>
  );
}
