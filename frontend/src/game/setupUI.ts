import Phaser from "phaser";
import { clampZoom } from "./setupCamera";

const SIDEBAR_WIDTH = 64;
const ICON_SIZE = 36;

export const SIDEBAR_ICONS = [
	{ key: "sidebar_announcements", path: "assets/icons/anouncements.png",  event: "sidebar:announcements", label: "Announcements" },
	{ key: "sidebar_resources",     path: "assets/icons/resources.png",     event: "sidebar:resources",     label: "Resources"     },
	{ key: "sidebar_find_peers",    path: "assets/icons/find-peers.png",    event: "sidebar:findPeers",     label: "Find Peers"    },
	{ key: "sidebar_chat",          path: "assets/icons/chat.png",          event: "sidebar:chat",          label: "Chat"          },
	{ key: "sidebar_profile",       path: "assets/icons/profile.png",       event: "sidebar:profile",       label: "Profile"       },
	{ key: "sidebar_leaderboards",  path: "assets/icons/leaderboards.png",  event: "sidebar:leaderboards",  label: "Leaderboards"  },
	{ key: "sidebar_feedback",      path: "assets/icons/feedback.png",      event: "sidebar:feedback",      label: "Feedback"      },
] as const;

export function setupUI(
	scene: Phaser.Scene,
	mainCamera: Phaser.Cameras.Scene2D.Camera,
): void {
	const padding = 12;
	const spacing = 8;
	const { width, height } = scene.cameras.main;

	const sidebar = scene.add
		.rectangle(width - SIDEBAR_WIDTH / 2, height / 2, SIDEBAR_WIDTH, height, 0x000000, 0.6)
		.setScrollFactor(0);

	const plusButton = scene.add
		.image(width - SIDEBAR_WIDTH - padding, padding, "plusButton")
		.setOrigin(1, 0)
		.setInteractive()
		.setScrollFactor(0)
		.setTint(0xaaaaaa);

	plusButton.on("pointerdown", () => clampZoom(scene, +0.1));
	plusButton.on("pointerover", () => plusButton.clearTint());
	plusButton.on("pointerout", () => plusButton.setTint(0xaaaaaa));

	const minusButton = scene.add
		.image(width - SIDEBAR_WIDTH - padding, padding + plusButton.displayHeight + spacing, "minusButton")
		.setOrigin(1, 0)
		.setInteractive()
		.setScrollFactor(0)
		.setTint(0xaaaaaa);

	minusButton.on("pointerdown", () => clampZoom(scene, -0.1));
	minusButton.on("pointerover", () => minusButton.clearTint());
	minusButton.on("pointerout", () => minusButton.setTint(0xaaaaaa));

	const sidebarCenterX = width - SIDEBAR_WIDTH / 2;
	const step = height / (SIDEBAR_ICONS.length + 1);
	const iconObjects: Phaser.GameObjects.GameObject[] = [];

	const TOOLTIP_PAD = 8;

	const tooltipBg = scene.add
		.rectangle(0, 0, 10, 10, 0x111111, 0.9)
		.setScrollFactor(0)
		.setVisible(false)
		.setDepth(20);

	const tooltipText = scene.add
		.text(0, 0, "", { fontSize: "11px", color: "#ffffff", fontFamily: "monospace" })
		.setOrigin(0.5, 0.5)
		.setScrollFactor(0)
		.setVisible(false)
		.setDepth(21);

	let hoverTimer: ReturnType<typeof setTimeout> | null = null;

	const showTooltip = (iconY: number, label: string) => {
		tooltipText.setText(label);
		const tw = tooltipText.width + TOOLTIP_PAD * 2;
		const th = tooltipText.height + TOOLTIP_PAD * 2;
		const tx = sidebarCenterX - SIDEBAR_WIDTH / 2 - tw / 2 - 6;
		tooltipBg.setPosition(tx, iconY).setSize(tw, th).setVisible(true);
		tooltipText.setPosition(tx, iconY).setVisible(true);
	};

	const hideTooltip = () => {
		if (hoverTimer !== null) { clearTimeout(hoverTimer); hoverTimer = null; }
		tooltipBg.setVisible(false);
		tooltipText.setVisible(false);
	};

	SIDEBAR_ICONS.forEach(({ key, event, label }, i) => {
		const y = step * (i + 1);

		const glow = scene.add
			.rectangle(sidebarCenterX, y, ICON_SIZE + 16, ICON_SIZE + 16, 0xffffff, 0)
			.setScrollFactor(0);

		const icon = scene.add
			.image(sidebarCenterX, y, key)
			.setDisplaySize(ICON_SIZE, ICON_SIZE)
			.setScrollFactor(0)
			.setInteractive()
			.setAlpha(0.75);

		icon.on("pointerover", () => {
			glow.setAlpha(0.2);
			icon.setAlpha(1);
			hoverTimer = setTimeout(() => showTooltip(y, label), 200);
		});
		icon.on("pointerout", () => {
			glow.setAlpha(0);
			icon.setAlpha(0.75);
			hideTooltip();
		});
		icon.on("pointerdown", () => { scene.events.emit(event); });

		iconObjects.push(glow, icon);
	});

	// Keep UI elements out of the main world camera
	mainCamera.ignore([sidebar, plusButton, minusButton, tooltipBg, tooltipText, ...iconObjects]);
}