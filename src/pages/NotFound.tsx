import { Link } from "react-router-dom";

const NotFound = () => {
	return (
		<div className="min-h-screen flex items-center justify-center p-6 text-center">
			<div>
				<h1 className="text-2xl font-bold mb-2">Page not found</h1>
				<p className="text-muted-foreground mb-4">The page you’re looking for doesn’t exist.</p>
				<Link to="/" className="text-primary underline">Go home</Link>
			</div>
		</div>
	);
};

export default NotFound;
