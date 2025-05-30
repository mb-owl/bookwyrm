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

	// Book cover styles
	coverContainer: {
		alignItems: "center",
		marginVertical: spacing.large,
	},

	coverImage: {
		width: 200,
		height: 300,
		borderRadius: borderRadius.medium,
		...shadows.medium,
	},

	noCoverContainer: {
		width: 200,
		height: 300,
		borderRadius: borderRadius.medium,
		backgroundColor: colors.lightGrey,
		justifyContent: "center",
		alignItems: "center",
		borderWidth: 1,
		borderColor: colors.border,
	},

	noCoverText: {
		color: colors.textSecondary,
		fontSize: typography.fontSize.default,
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
		marginTop: spacing.small,
	},

	photoContainer: {
		width: "31%",
		aspectRatio: 1,
		margin: "1%",
		borderRadius: borderRadius.small,
		overflow: "hidden",
	},

	photoThumbnail: {
		width: "100%",
		height: "100%",
	},

	photoViewerContainer: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.9)",
		justifyContent: "center",
		alignItems: "center",
	},

	fullSizePhoto: {
		width: "90%",
		height: "70%",
	},

	closeButton: {
		position: "absolute",
		top: 40,
		right: 20,
		backgroundColor: "rgba(255,255,255,0.3)",
		width: 40,
		height: 40,
		borderRadius: 20,
		justifyContent: "center",
		alignItems: "center",
		zIndex: 10,
	},

	closeButtonText: {
		color: colors.white,
		fontSize: 24,
		fontWeight: typography.fontWeight.bold,
	},

	photoNavigation: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		width: "80%",
		paddingVertical: spacing.large,
	},

	photoNavButton: {
		backgroundColor: "rgba(255,255,255,0.3)",
		width: 50,
		height: 50,
		borderRadius: 25,
		justifyContent: "center",
		alignItems: "center",
	},

	disabledNavButton: {
		opacity: 0.3,
	},

	photoNavButtonText: {
		color: colors.white,
		fontSize: 24,
	},

	photoCounter: {
		color: colors.white,
		fontSize: typography.fontSize.medium,
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
