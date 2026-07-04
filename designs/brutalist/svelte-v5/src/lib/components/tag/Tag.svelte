<script lang="ts">
  import "./tag.css";

  // Tag has no framework-neutral contract yet (same status as Card). Mirrors
  // the default cell's prop shape exactly: a label chip with a two-value tone
  // axis, defaulting to "neutral".
  interface Props {
    label: string;
    tone?: "neutral" | "accent";
  }

  let { label, tone = "neutral" }: Props = $props();
</script>

<span class="brutal-tag" data-tone={tone}>{label}</span>
