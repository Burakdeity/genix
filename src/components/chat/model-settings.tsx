"use client";

import { GEMINI_MODELS } from "@/server/types/gemini.types";
import type { ChatSettings } from "@/types/chat.types";
import { TemperatureSlider } from "@/components/chat/temperature-slider";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ToggleSwitch } from "@/components/ui/toggle-switch";

interface ModelSettingsProps {
  settings: ChatSettings;
  onChange: (settings: Partial<ChatSettings>) => void;
}

export function ModelSettings({ settings, onChange }: ModelSettingsProps) {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Model
        </Label>
        <Select
          value={settings.model}
          onValueChange={(value) =>
            onChange({ model: value as ChatSettings["model"] })
          }
        >
          <SelectTrigger className="border-border bg-muted/40">
            <SelectValue placeholder="Model seçin" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={GEMINI_MODELS.FLASH_LITE}>
              gemini-flash-lite-latest
            </SelectItem>
            <SelectItem value={GEMINI_MODELS.FLASH}>
              gemini-flash-latest
            </SelectItem>
            <SelectItem value={GEMINI_MODELS.PRO}>gemini-pro-latest</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Sıcaklık (Temperature)</Label>
          <span className="rounded-md bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">
            {settings.temperature.toFixed(1)}
          </span>
        </div>
        <TemperatureSlider
          value={settings.temperature}
          onChange={(temperature) => onChange({ temperature })}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Sistem Talimatı</Label>
        <Textarea
          value={settings.systemInstruction}
          onChange={(event) =>
            onChange({ systemInstruction: event.target.value })
          }
          className="min-h-[110px] resize-none border-border bg-muted/40 text-sm"
        />
      </div>

      <div className="space-y-2">
        <ToggleSwitch
          id="streaming-toggle"
          label={`Streaming: ${settings.streaming ? "Açık" : "Kapalı"}`}
          checked={settings.streaming}
          onCheckedChange={(streaming) => onChange({ streaming })}
        />
        <ToggleSwitch
          id="json-toggle"
          label={`JSON Çıktı: ${settings.structuredOutput ? "Açık" : "Kapalı"}`}
          checked={settings.structuredOutput}
          onCheckedChange={(structuredOutput) =>
            onChange({ structuredOutput })
          }
        />
      </div>
    </div>
  );
}
