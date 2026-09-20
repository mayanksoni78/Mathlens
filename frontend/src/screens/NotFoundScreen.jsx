import { Link } from 'react-router-dom';
import { Button } from '../components/common/Button.jsx';

export function NotFoundScreen() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="text-6xl font-black text-indigo-600">404</div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
        Page Not Found
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
        The math module or coordinates you are looking for do not exist in this matrix.
      </p>
      <Link to="/">
        <Button variant="primary">Return to Home</Button>
      </Link>
    </div>
  );
}

export default NotFoundScreen;
