/**
 * Main theme configuration file
 * Contains colors, typography, and spacing constants
 */

// App color palette
export const colors = {
	// Primary colors
	primary: "#007BFF",
	primaryDark: "#0056b3",
	primaryLight: "#e8f4fd",

	// Secondary colors
	secondary: "#3498db",
	secondaryDark: "#2980b9",
	secondaryLight: "#cce5ff",

	// Success/action colors
	success: "#28a745",
	danger: "#dc3545",
	warning: "#ffc107",
	info: "#17a2b8",

	// Neutral colors
	white: "#ffffff",
	black: "#000000",
	grey: "#7f8c8d",
	lightGrey: "#f0f0f0",
	veryLightGrey: "#f8f8f8",
	mediumGrey: "#95a5a6",
	darkGrey: "#34495e",

	// Background colors
	background: "#ffffff",
	backgroundAlt: "#f9f9f9",
	backgroundInput: "#f9f9f9",

	// Border colors
	border: "#ddd",
	borderLight: "#e0e0e0",
	borderFocus: "#007BFF",

	// Text colors
	text: "#2c3e50",
	textSecondary: "#7f8c8d",
	textLight: "#bdc3c7",
	textDanger: "#e74c3c",

	// Status colors
	favorite: "#ffd700",
	favoriteBackground: "#fff3cd",

	// Content warning colors
	warningBackground: "#ffebee",
	warningBorder: "#ffcdd2",
	warningText: "#c62828",

	// Star rating colors
	starFilled: "#FFD700",
	starEmpty: "#ddd",
};

// Typography definitions
export const typography = {
	// Font families
	fontFamily: {
		primary: "System", // System font
		secondary: "Georgia",
	},

	// Font sizes
	fontSize: {
		tiny: 10,
		small: 12,
		medium: 14,
		default: 16,
		large: 18,
		xlarge: 20,
		xxlarge: 24,
		huge: 32,
	},

	// Font weights
	fontWeight: {
		normal: "normal",
		medium: "500",
		semibold: "600",
		bold: "bold",
	},

	// Line heights
	lineHeight: {
		tight: 1.2,
		normal: 1.5,
		loose: 1.8,
	},
};

// Spacing constants
export const spacing = {
	tiny: 4,
	small: 8,
	medium: 12,
	default: 16,
	large: 20,
	xlarge: 24,
	xxlarge: 32,
	xxxlarge: 40,
};

// Border radius constants
export const borderRadius = {
	small: 4,
	medium: 8,
	large: 10,
	pill: 20,
	circle: 50,
};

// Shadow styles
export const shadows = {
	small: {
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 2,
		elevation: 1,
	},
	medium: {
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 3,
		elevation: 3,
	},
	large: {
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.25,
		shadowRadius: 5,
		elevation: 5,
	},
};
