/**
 * Styles for book listings, cards, and details
 */
import { StyleSheet } from "react-native";
import { colors, typography, spacing, borderRadius, shadows } from "./theme";

export default StyleSheet.create({
	// Book list styles
	bookList: {
		marginBottom: spacing.xxxlarge,
	},

	bookItem: {
		padding: spacing.medium,
		borderBottomWidth: 1,
		borderBottomColor: colors.borderLight,
	},

	selectedItem: {
		backgroundColor: "rgba(0, 123, 255, 0.1)",
	},

	itemRow: {
		flexDirection: "row",
		alignItems: "center",
	},

	itemContent: {
		flex: 1,
	},

	// Book titles and metadata in lists
	bookTitle: {
		fontSize: typography.fontSize.default,
		fontWeight: typography.fontWeight.bold,
		marginBottom: spacing.tiny,
		color: colors.text,
	},

	bookAuthor: {
		fontSize: typography.fontSize.medium,
		color: colors.textSecondary,
	},

	// Cover image styles
	coverContainer: {
		alignItems: "center",
		justifyContent: "center",
		marginVertical: 16,
		minHeight: 250,
	},
	coverImage: {
		width: 200,
		height: 300,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: "#ddd",
		backgroundColor: "#f8f8f8",
	},
	generatedCoverContainer: {
		position: "relative",
		width: 200,
		height: 300,
	},
	generatedCoverLabel: {
		position: "absolute",
		bottom: 0,
		right: 0,
		backgroundColor: "rgba(0,0,0,0.6)",
		color: "white",
		padding: 4,
		fontSize: 10,
		borderTopLeftRadius: 4,
	},
	noCoverContainer: {
		width: 200,
		height: 300,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: "#ddd",
		backgroundColor: "#f8f8f8",
		justifyContent: "center",
		alignItems: "center",
	},
	noCoverText: {
		fontSize: 16,
		color: "#999",
		textAlign: "center",
		paddingHorizontal: 10,
	},
	coverLoadingContainer: {
		width: 200,
		height: 300,
		borderRadius: 8,
		borderWidth: 1,
		borderColor: "#ddd",
		backgroundColor: "#f8f8f8",
		justifyContent: "center",
		alignItems: "center",
	},
	coverLoadingText: {
		marginTop: 10,
		fontSize: 14,
		color: "#666",
	},
	findCoverButton: {
		marginTop: 15,
		backgroundColor: "#007bff",
		paddingVertical: 8,
		paddingHorizontal: 12,
		borderRadius: 4,
	},
	findCoverButtonText: {
		color: "white",
		fontSize: 14,
		fontWeight: "500",
	},
	coverError: {
		borderColor: "#ffcccc",
		backgroundColor: "#fff5f5",
	},
	coverErrorText: {
		color: "#cc0000",
		fontSize: 12,
		marginTop: 5,
		textAlign: "center",
		fontStyle: "italic",
	},

	// Book detail header
	titleContainer: {
		alignItems: "center",
		marginBottom: spacing.xlarge,
		paddingHorizontal: spacing.large,
	},

	bookTitleLarge: {
		fontSize: typography.fontSize.xxlarge,
		fontWeight: typography.fontWeight.bold,
		textAlign: "center",
		color: colors.text,
		marginBottom: spacing.small,
	},

	bookAuthorLarge: {
		fontSize: typography.fontSize.large,
		color: colors.textSecondary,
		textAlign: "center",
	},

	// Book status indicators
	statusContainer: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "center",
		marginVertical: spacing.small,
	},

	statusBadge: {
		paddingVertical: spacing.small,
		paddingHorizontal: spacing.medium,
		borderRadius: borderRadius.pill,
		margin: spacing.tiny,
		backgroundColor: colors.lightGrey,
		borderWidth: 1,
		borderColor: colors.border,
	},

	activeStatusBadge: {
		backgroundColor: colors.primaryLight,
		borderColor: colors.primary,
	},

	statusText: {
		fontSize: typography.fontSize.medium,
		color: colors.textSecondary,
	},

	activeStatusText: {
		color: colors.primary,
		fontWeight: typography.fontWeight.semibold,
	},

	favoriteBadge: {
		backgroundColor: colors.favoriteBackground,
		borderColor: colors.favorite,
	},

	favoriteText: {
		color: colors.warning,
		fontWeight: typography.fontWeight.semibold,
	},

	// Deeper details section
	deeperLookButton: {
		backgroundColor: colors.lightGrey,
		borderRadius: borderRadius.medium,
		padding: spacing.default,
		marginVertical: spacing.medium,
		flexDirection: "row",
		justifyContent: "center",
		alignItems: "center",
		borderWidth: 1,
		borderColor: colors.border,
	},

	deeperLookButtonText: {
		fontSize: typography.fontSize.default,
		color: colors.secondary,
		fontWeight: typography.fontWeight.semibold,
		marginRight: spacing.small,
	},

	deeperLookIcon: {
		fontSize: typography.fontSize.medium,
		color: colors.secondary,
	},

	deeperDetailsContainer: {
		overflow: "hidden",
	},

	deeperSectionContainer: {
		backgroundColor: colors.veryLightGrey,
		borderRadius: borderRadius.medium,
		padding: spacing.default,
		marginBottom: spacing.default,
		borderLeftWidth: 3,
		borderLeftColor: colors.border,
	},

	deeperSectionTitle: {
		fontSize: typography.fontSize.default,
		fontWeight: typography.fontWeight.bold,
		color: colors.textSecondary,
		marginBottom: spacing.small,
	},

	// Content warnings
	warningTitle: {
		color: colors.textDanger,
	},

	warningContainer: {
		flexDirection: "row",
		flexWrap: "wrap",
		marginTop: spacing.small,
	},

	warningBadge: {
		backgroundColor: colors.warningBackground,
		borderRadius: borderRadius.pill,
		paddingVertical: spacing.small,
		paddingHorizontal: spacing.medium,
		margin: spacing.tiny,
		borderWidth: 1,
		borderColor: colors.warningBorder,
	},

	warningText: {
		color: colors.warningText,
		fontSize: typography.fontSize.medium,
	},

	// Search results
	searchResultsContainer: {
		marginBottom: spacing.default,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: borderRadius.small,
		backgroundColor: colors.white,
		...shadows.medium,
		zIndex: 999,
	},

	searchResultsTitle: {
		fontSize: typography.fontSize.medium,
		fontWeight: typography.fontWeight.medium,
		padding: spacing.small,
		backgroundColor: colors.veryLightGrey,
		borderBottomWidth: 1,
		borderBottomColor: colors.borderLight,
	},

	searchResultsList: {
		maxHeight: 300,
	},

	searchResultItem: {
		padding: spacing.medium,
		borderBottomWidth: 1,
		borderBottomColor: colors.borderLight,
	},

	searchResultContent: {
		flexDirection: "row",
		alignItems: "center",
	},

	resultTextContainer: {
		flex: 1,
	},

	resultTitle: {
		fontSize: typography.fontSize.default,
		fontWeight: typography.fontWeight.medium,
		marginBottom: spacing.tiny,
	},

	resultAuthor: {
		fontSize: typography.fontSize.medium,
		color: colors.textSecondary,
		marginBottom: spacing.tiny,
	},

	resultYear: {
		fontSize: typography.fontSize.small,
		color: colors.textSecondary,
	},

	// Selection mode
	checkmark: {
		color: colors.white,
		fontSize: typography.fontSize.default,
	},

	selectionBar: {
		position: "absolute",
		bottom: 0,
		left: 0,
		right: 0,
		backgroundColor: colors.white,
		borderTopWidth: 1,
		borderTopColor: colors.border,
		padding: spacing.medium,
		...shadows.medium,
	},

	selectionText: {
		textAlign: "center",
		marginBottom: spacing.small,
		fontSize: typography.fontSize.default,
		fontWeight: typography.fontWeight.bold,
	},

	selectionButtons: {
		flexDirection: "row",
		justifyContent: "space-around",
	},

	// Sort UI
	sortButtonContainer: {
		flexDirection: "row",
		alignItems: "center",
		paddingHorizontal: spacing.medium,
		paddingVertical: spacing.small,
		borderBottomWidth: 1,
		borderBottomColor: colors.borderLight,
	},

	sortLabel: {
		fontSize: typography.fontSize.medium,
		marginRight: spacing.small,
		color: colors.textSecondary,
	},

	sortButton: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: colors.lightGrey,
		paddingHorizontal: spacing.medium,
		paddingVertical: spacing.small,
		borderRadius: borderRadius.small,
	},

	sortButtonText: {
		fontSize: typography.fontSize.medium,
		color: colors.primary,
		fontWeight: typography.fontWeight.medium,
	},

	sortButtonIcon: {
		fontSize: typography.fontSize.small,
		color: colors.primary,
		marginLeft: spacing.tiny,
	},

	// Add photo gallery styles
	photoGallery: {
		flexDirection: "row",
		flexWrap: "wrap",
		justifyContent: "flex-start",
		marginVertical: 10,
	},

	photoContainer: {
		width: "31%" /* About 3 photos per row with spacing */,
		aspectRatio: 1,
		margin: "1%",
		borderRadius: 8,
		overflow: "hidden",
		backgroundColor: "#f0f0f0",
		// Add shadow for better visual appearance
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 3,
		elevation: 2,
		position: "relative" /* For loading indicators */,
	},

	photoThumbnail: {
		width: "100%",
		height: "100%",
	},

	photoLoadingIndicator: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "rgba(0,0,0,0.1)",
	},

	photoError: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		justifyContent: "center",
		alignItems: "center",
		backgroundColor: "#f8d7da",
	},

	photoErrorText: {
		color: "#721c24",
		fontSize: 10,
		textAlign: "center",
		padding: 4,
	},

	// Add styles for genre badges
	genreContainer: {
		flexDirection: "row",
		flexWrap: "wrap",
		marginTop: 4,
	},

	genreBadge: {
		backgroundColor: "#e1f5fe",
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 12,
		marginRight: 8,
		marginBottom: 6,
	},

	genreBadgeText: {
		color: "#0288d1",
		fontSize: 14,
		fontWeight: "500",
	},
});
