/**
 * Styles for buttons and interactive elements
 */
import { StyleSheet } from "react-native";
import { colors, typography, spacing, borderRadius } from "./theme";

export default StyleSheet.create({
	// Primary buttons
	primaryButton: {
		backgroundColor: colors.primary,
		paddingVertical: spacing.medium,
		paddingHorizontal: spacing.large,
		borderRadius: borderRadius.small,
		alignItems: "center",
		marginVertical: spacing.small,
	},

	primaryButtonText: {
		color: colors.white,
		fontSize: typography.fontSize.default,
		fontWeight: typography.fontWeight.medium,
	},

	// Secondary buttons
	secondaryButton: {
		backgroundColor: colors.secondary,
		paddingVertical: spacing.medium,
		paddingHorizontal: spacing.large,
		borderRadius: borderRadius.small,
		alignItems: "center",
	},

	secondaryButtonText: {
		color: colors.white,
		fontSize: typography.fontSize.default,
		fontWeight: typography.fontWeight.medium,
	},

	// Action buttons (success, danger, etc.)
	successButton: {
		backgroundColor: colors.success,
		paddingVertical: spacing.medium,
		paddingHorizontal: spacing.large,
		borderRadius: borderRadius.small,
		alignItems: "center",
	},

	dangerButton: {
		backgroundColor: colors.danger,
		paddingVertical: spacing.medium,
		paddingHorizontal: spacing.large,
		borderRadius: borderRadius.small,
		alignItems: "center",
	},

	warningButton: {
		backgroundColor: colors.warning,
		paddingVertical: spacing.medium,
		paddingHorizontal: spacing.large,
		borderRadius: borderRadius.small,
		alignItems: "center",
	},

	// Header buttons
	headerButton: {
		padding: spacing.medium,
	},

	headerButtonText: {
		fontSize: typography.fontSize.xlarge,
		color: colors.primary,
	},

	backButton: {
		padding: spacing.medium,
		marginRight: spacing.tiny,
	},

	backButtonText: {
		fontSize: typography.fontSize.default,
		color: colors.primary,
	},

	favoriteButton: {
		padding: spacing.medium,
		marginRight: spacing.tiny,
	},

	favoriteButtonText: {
		fontSize: 24,
	},

	// Icon buttons
	iconButton: {
		padding: spacing.small,
	},

	// Action buttons in book list/detail
	actionButton: {
		paddingHorizontal: spacing.medium,
		paddingVertical: spacing.small,
		marginHorizontal: spacing.tiny,
	},

	actionButtonText: {
		fontSize: typography.fontSize.medium,
		color: colors.secondary,
	},

	// Floating action button
	floatingActionButton: {
		position: "absolute",
		bottom: spacing.large,
		alignSelf: "center",
		backgroundColor: colors.success,
		paddingVertical: spacing.medium,
		paddingHorizontal: spacing.large,
		borderRadius: borderRadius.small,
		alignItems: "center",
		elevation: 5,
		shadowColor: colors.black,
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.25,
		shadowRadius: 3.84,
	},

	// Button rows
	buttonRow: {
		flexDirection: "row",
		justifyContent: "space-around",
		marginTop: spacing.xlarge,
	},

	// Specialized buttons
	ratingButton: {
		backgroundColor: colors.primary,
		padding: spacing.medium,
		borderRadius: borderRadius.small,
		width: 40,
		alignItems: "center",
	},

	ratingButtonText: {
		color: colors.white,
		fontWeight: typography.fontWeight.medium,
	},

	modalButton: {
		paddingVertical: spacing.medium,
		paddingHorizontal: spacing.large,
		borderRadius: borderRadius.small,
		alignItems: "center",
	},

	modalButtonText: {
		color: colors.white,
		fontWeight: typography.fontWeight.medium,
	},

	cancelButton: {
		backgroundColor: colors.grey,
	},

	saveButton: {
		backgroundColor: colors.success,
	},

	closeButton: {
		marginTop: spacing.default,
		alignSelf: "center",
		paddingVertical: spacing.medium,
		paddingHorizontal: spacing.large,
		backgroundColor: colors.primary,
		borderRadius: borderRadius.small,
	},

	closeButtonText: {
		color: colors.white,
		fontSize: typography.fontSize.default,
		fontWeight: typography.fontWeight.medium,
	},

	// Selection mode buttons
	selectionModeButton: {
		paddingHorizontal: spacing.medium,
		paddingVertical: spacing.small,
		backgroundColor: colors.lightGrey,
		borderRadius: borderRadius.small,
	},

	selectionModeButtonText: {
		color: colors.primary,
	},

	selectionButton: {
		paddingVertical: spacing.small,
		paddingHorizontal: spacing.medium,
		backgroundColor: colors.primary,
		borderRadius: borderRadius.small,
		minWidth: 80,
		alignItems: "center",
	},

	// Button states
	disabledButton: {
		opacity: 0.5,
	},
});
