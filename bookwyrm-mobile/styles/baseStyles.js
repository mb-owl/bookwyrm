/**
 * Base styles for layouts, containers, and common elements
 */
import { StyleSheet } from "react-native";
import { colors, typography, spacing, borderRadius, shadows } from "./theme";

export default StyleSheet.create({
	// Main containers
	container: {
		flex: 1,
		padding: spacing.default,
		backgroundColor: colors.background,
	},

	centeredContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: colors.background,
		padding: spacing.default,
	},

	scrollViewContent: {
		flexGrow: 1,
		paddingBottom: spacing.xxlarge,
	},

	// Common section containers
	sectionContainer: {
		backgroundColor: colors.backgroundAlt,
		borderRadius: borderRadius.medium,
		padding: spacing.default,
		marginBottom: spacing.default,
		...shadows.small,
	},

	sectionHeaderRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: spacing.small,
	},

	sectionTitle: {
		fontSize: typography.fontSize.large,
		fontWeight: typography.fontWeight.bold,
		color: colors.darkGrey,
		marginBottom: spacing.small,
	},

	sectionDivider: {
		height: 1,
		backgroundColor: colors.borderLight,
		marginBottom: spacing.medium,
	},

	// Flex utility styles
	row: {
		flexDirection: "row",
		alignItems: "center",
	},

	spaceBetween: {
		justifyContent: "space-between",
	},

	center: {
		justifyContent: "center",
		alignItems: "center",
	},

	// Spacing utilities
	spacer: {
		height: spacing.default,
	},

	smallSpacer: {
		height: spacing.small,
	},

	largeSpacer: {
		height: spacing.large,
	},

	bottomSpacer: {
		height: spacing.xxxlarge,
	},

	// Text styles
	headerText: {
		fontSize: typography.fontSize.xxlarge,
		fontWeight: typography.fontWeight.bold,
		color: colors.text,
		marginBottom: spacing.medium,
	},

	titleText: {
		fontSize: typography.fontSize.xlarge,
		fontWeight: typography.fontWeight.bold,
		color: colors.text,
	},

	subtitleText: {
		fontSize: typography.fontSize.large,
		color: colors.textSecondary,
		marginBottom: spacing.medium,
	},

	bodyText: {
		fontSize: typography.fontSize.default,
		color: colors.text,
		lineHeight: typography.lineHeight.normal,
	},

	captionText: {
		fontSize: typography.fontSize.small,
		color: colors.textSecondary,
	},

	errorText: {
		fontSize: typography.fontSize.default,
		color: colors.textDanger,
		marginBottom: spacing.medium,
		textAlign: "center",
	},

	// Field containers and labels
	fieldContainer: {
		marginBottom: spacing.medium,
	},

	fieldLabel: {
		fontSize: typography.fontSize.medium,
		fontWeight: typography.fontWeight.semibold,
		color: colors.darkGrey,
		marginBottom: spacing.tiny,
	},

	fieldValue: {
		fontSize: typography.fontSize.default,
		color: colors.text,
		lineHeight: 24,
	},

	emptyFieldLabel: {
		color: colors.mediumGrey,
	},

	emptyFieldValue: {
		color: colors.textLight,
		fontStyle: "italic",
	},

	// Loading states
	loadingContainer: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: colors.background,
	},

	loadingText: {
		marginTop: spacing.default,
		fontSize: typography.fontSize.default,
		color: colors.textSecondary,
	},
});
