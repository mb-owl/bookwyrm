/**
 * Styles for modals, overlays, and popups
 */
import { StyleSheet } from "react-native";
import { colors, typography, spacing, borderRadius } from "./theme";

export default StyleSheet.create({
	// Modal containers
	modalOverlay: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.5)",
		justifyContent: "center",
		alignItems: "center",
	},

	modalContent: {
		width: "80%",
		backgroundColor: colors.white,
		borderRadius: borderRadius.large,
		padding: spacing.large,
		maxHeight: "70%",
	},

	fullHeightModalContent: {
		width: "85%",
		height: "80%",
		backgroundColor: colors.white,
		borderRadius: borderRadius.large,
		padding: spacing.large,
	},

	bottomModalContent: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		backgroundColor: colors.white,
		borderTopLeftRadius: borderRadius.large,
		borderTopRightRadius: borderRadius.large,
		padding: spacing.large,
		paddingBottom: spacing.xxlarge,
	},

	// Modal headers
	modalTitle: {
		fontSize: typography.fontSize.large,
		fontWeight: typography.fontWeight.bold,
		marginBottom: spacing.large,
		textAlign: "center",
	},

	modalSubtitle: {
		fontSize: typography.fontSize.medium,
		color: colors.textSecondary,
		marginBottom: spacing.medium,
		textAlign: "center",
	},

	// Modal items (like in dropdown lists)
	modalItem: {
		padding: spacing.medium,
		borderBottomWidth: 1,
		borderBottomColor: colors.borderLight,
	},

	modalItemSelected: {
		backgroundColor: colors.primaryLight,
	},

	modalItemText: {
		fontSize: typography.fontSize.default,
	},

	modalItemTextSelected: {
		fontWeight: typography.fontWeight.medium,
		color: colors.primary,
	},

	// Button arrangement in modals
	modalButtonRow: {
		flexDirection: "row",
		justifyContent: "flex-end",
		marginTop: spacing.medium,
	},

	modalButtonRowCentered: {
		flexDirection: "row",
		justifyContent: "center",
		marginTop: spacing.large,
	},

	modalButtonRowSpaced: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginTop: spacing.large,
	},

	// Year/date picker modal styles
	yearItem: {
		paddingVertical: spacing.medium,
		paddingHorizontal: spacing.default,
		borderBottomWidth: 1,
		borderBottomColor: colors.borderLight,
		alignItems: "center",
	},

	yearText: {
		fontSize: typography.fontSize.default,
	},

	selectedYearText: {
		fontWeight: typography.fontWeight.bold,
		color: colors.primary,
	},

	// Genre modal specific styles
	genreItem: {
		padding: spacing.medium,
		borderBottomWidth: 1,
		borderBottomColor: colors.borderLight,
	},

	genreItemRow: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
	},

	genreItemText: {
		fontSize: typography.fontSize.default,
	},

	checkbox: {
		width: 20,
		height: 20,
		borderWidth: 1,
		borderColor: colors.primary,
		borderRadius: borderRadius.small,
		justifyContent: "center",
		alignItems: "center",
	},

	checkboxSelected: {
		width: 14,
		height: 14,
		backgroundColor: colors.primary,
		borderRadius: 3,
	},

	// Sort modal specific styles
	sortOption: {
		paddingVertical: spacing.medium,
		paddingHorizontal: spacing.default,
		borderBottomWidth: 1,
		borderBottomColor: colors.borderLight,
	},

	selectedSortOption: {
		backgroundColor: "rgba(0, 123, 255, 0.1)",
	},

	sortOptionText: {
		fontSize: typography.fontSize.default,
		color: colors.text,
	},

	selectedSortOptionText: {
		fontWeight: typography.fontWeight.bold,
		color: colors.primary,
	},

	// Section dividers in modals
	sectionDivider: {
		fontSize: typography.fontSize.medium,
		fontWeight: typography.fontWeight.bold,
		color: colors.textSecondary,
		backgroundColor: colors.veryLightGrey,
		paddingVertical: spacing.small,
		paddingHorizontal: spacing.default,
		marginVertical: spacing.small,
	},
});
