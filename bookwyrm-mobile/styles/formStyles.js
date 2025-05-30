/**
 * Styles for forms, inputs, and interactive elements
 */
import { StyleSheet } from "react-native";
import { colors, typography, spacing, borderRadius } from "./theme";

export default StyleSheet.create({
	// Text inputs
	input: {
		height: 40,
		borderColor: colors.border,
		borderWidth: 1,
		marginBottom: spacing.default,
		paddingHorizontal: spacing.medium,
		borderRadius: borderRadius.small,
		backgroundColor: colors.white,
	},

	textArea: {
		height: 100,
		textAlignVertical: "top",
		paddingTop: spacing.medium,
	},

	searchContainer: {
		position: "relative",
		marginBottom: spacing.default,
	},

	searchInput: {
		borderColor: colors.border,
		borderWidth: 1,
		borderRadius: borderRadius.small,
		padding: spacing.small,
		margin: spacing.small,
	},

	searchIndicator: {
		position: "absolute",
		right: spacing.medium,
		top: spacing.medium,
	},

	// Dropdown/Select elements
	dropdownButton: {
		backgroundColor: colors.lightGrey,
		padding: spacing.medium,
		borderRadius: borderRadius.small,
		borderWidth: 1,
		borderColor: colors.border,
		marginBottom: spacing.default,
	},

	dropdownButtonText: {
		color: colors.text,
	},

	// Toggle switches
	switchContainer: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: spacing.large,
		paddingVertical: spacing.small,
		borderBottomWidth: 1,
		borderBottomColor: colors.lightGrey,
	},

	switchLabel: {
		fontSize: typography.fontSize.default,
		color: colors.text,
	},

	// Form sections
	formSection: {
		marginBottom: spacing.xlarge,
	},

	formSectionTitle: {
		fontSize: typography.fontSize.medium,
		fontWeight: typography.fontWeight.semibold,
		color: colors.primary,
		marginBottom: spacing.small,
	},

	// Image picker
	imagePicker: {
		backgroundColor: colors.lightGrey,
		padding: spacing.medium,
		borderRadius: borderRadius.small,
		alignItems: "center",
		marginBottom: spacing.default,
	},

	imagePickerText: {
		color: colors.primary,
	},

	imagePreview: {
		width: "100%",
		height: 200,
		resizeMode: "cover",
		marginBottom: spacing.default,
		borderRadius: borderRadius.medium,
	},

	// Rating elements
	ratingContainer: {
		backgroundColor: colors.veryLightGrey,
		padding: spacing.large,
		borderRadius: borderRadius.medium,
		borderWidth: 1,
		borderColor: colors.border,
		marginBottom: spacing.large,
	},

	ratingInputRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: spacing.medium,
	},

	ratingInput: {
		textAlign: "center",
		flex: 1,
		marginHorizontal: spacing.small,
	},

	ratingScale: {
		flexDirection: "row",
		justifyContent: "space-between",
		marginBottom: spacing.medium,
	},

	starButton: {
		padding: 0,
	},

	starText: {
		fontSize: 24,
	},

	starFilled: {
		color: colors.starFilled,
	},

	starEmpty: {
		color: colors.starEmpty,
	},

	ratingHelp: {
		fontSize: typography.fontSize.small,
		color: colors.textSecondary,
		textAlign: "center",
	},

	// Emoji selector
	emojiButton: {
		backgroundColor: colors.primary,
		padding: spacing.medium,
		borderRadius: borderRadius.small,
		alignItems: "center",
		marginBottom: spacing.large,
	},

	emojiDisplay: {
		fontSize: 32,
	},

	emojiOption: {
		flex: 1,
		alignItems: "center",
		padding: spacing.medium,
	},

	emojiText: {
		fontSize: 28,
	},

	emojiDescription: {
		fontSize: typography.fontSize.small,
		color: colors.textSecondary,
		textAlign: "center",
	},

	// Form disabled states
	disabledSection: {
		backgroundColor: colors.veryLightGrey,
		borderRadius: borderRadius.medium,
		padding: spacing.default,
		borderWidth: 1,
		borderColor: colors.border,
		marginBottom: spacing.default,
	},

	disabledText: {
		color: colors.textSecondary,
		textAlign: "center",
		fontStyle: "italic",
	},
});
