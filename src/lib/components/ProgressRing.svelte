<script lang="ts">
	type Props = {
		value: number;
		size?: number;
		stroke?: number;
		label?: string;
	};
	let { value, size = 164, stroke = 7, label = 'Readiness' }: Props = $props();
	const radius = $derived((size - stroke) / 2);
	const circumference = $derived(2 * Math.PI * radius);
	const offset = $derived(circumference * (1 - Math.max(0, Math.min(100, value)) / 100));
</script>

<div class="relative grid place-items-center" style:width="{size}px" style:height="{size}px">
	<svg
		viewBox="0 0 {size} {size}"
		class="-rotate-90"
		style:width="{size}px"
		style:height="{size}px"
		role="img"
		aria-label={`${label}: ${value} out of 100`}
	>
		<circle
			cx={size / 2}
			cy={size / 2}
			r={radius}
			fill="none"
			stroke="rgba(255,255,255,0.065)"
			stroke-width={stroke}
		/>
		<circle
			cx={size / 2}
			cy={size / 2}
			r={radius}
			fill="none"
			stroke="url(#ring-gradient)"
			stroke-width={stroke}
			stroke-linecap="round"
			stroke-dasharray="{circumference} {circumference}"
			stroke-dashoffset={offset}
			style="transition: stroke-dashoffset 900ms cubic-bezier(0.16,1,0.3,1)"
		/>
		<defs>
			<linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
				<stop offset="0%" stop-color="#c77dff" />
				<stop offset="55%" stop-color="#a100ff" />
				<stop offset="100%" stop-color="#5b21b6" />
			</linearGradient>
		</defs>
	</svg>
	<div class="absolute inset-0 grid place-content-center text-center">
		<div
			class="font-display text-[2.6rem] leading-none font-semibold tracking-[-0.06em] text-white"
		>
			{value}
		</div>
		<div class="mt-2 text-[0.58rem] font-semibold tracking-[0.2em] text-fog uppercase">{label}</div>
	</div>
</div>
