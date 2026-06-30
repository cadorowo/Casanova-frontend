'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { api } from '@/lib/api';
import { Game } from '@/types';

export default function FavoritesPage() {
  const router = useRouter();
  const { isAuthenticated, token } = useAuth();
  const [favoriteGames, setFavoriteGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }

    const fetchFavorites = async () => {
      if (!token) return;

      try {
        const profileData = await api.user.getProfile(token);
        const favoriteIds = profileData.favoriteGames || [];

        const gamesData = await api.games.getAll();

        const favorites = gamesData.filter((game: Game) =>
          favoriteIds.includes(game._id)
        );
        setFavoriteGames(favorites);
      } catch {
        setError('Échec du chargement des favoris');
      } finally {
        setIsLoading(false);
      }
    };

    fetchFavorites();
  }, [isAuthenticated, token, router]);

  const handleRemoveFavorite = async (gameId: string) => {
    if (!token) return;

    try {
      await api.user.toggleFavorite(token, gameId);
      setFavoriteGames(favoriteGames.filter((game) => game._id !== gameId));
    } catch {
      alert('Échec de la suppression des favoris');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-20 pb-12 px-4" style={{
        background: 'linear-gradient(135deg, #1a0033 0%, #330066 50%, #1a0033 100%)'
      }}>
        <div className="text-center text-white text-xl">Chargement des favoris...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-12 px-4" style={{
      background: 'linear-gradient(135deg, #1a0033 0%, #330066 50%, #1a0033 100%)'
    }}>
      <div className="container mx-auto max-w-7xl">
        {}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-black text-white uppercase tracking-widest">
              Mes Jeux Favoris ❤️
            </h1>
            <Link
              href="/dashboard"
              className="text-purple-400 hover:text-purple-300 font-medium"
            >
              ← Retour au Tableau de Bord
            </Link>
          </div>
          <p className="text-gray-300">
            {favoriteGames.length} favori{favoriteGames.length !== 1 ? 's' : ''}
          </p>
        </div>

        {}
        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {}
        {favoriteGames.length === 0 ? (
          <div className="bg-gray-900/80 backdrop-blur-sm rounded-2xl p-12 border border-gray-800 text-center">
            <div className="text-6xl mb-4">🤍</div>
            <h2 className="text-2xl font-bold text-white mb-4">Pas encore de favoris</h2>
            <p className="text-gray-400 mb-6">
              Commencez à ajouter des jeux à vos favoris pour les voir ici !
            </p>
            <Link
              href="/"
              className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
            >
              Parcourir les Jeux
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {favoriteGames.map((game) => (
              <div
                key={game._id}
                className="bg-gray-900/80 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-800 hover:border-purple-500 transition-all group"
              >
                {}
                <div className="relative aspect-video bg-gray-800">
                  <Link href={`/games/${game.slug}`}>
                    <Image
                      src={game.thumbnail}
                      alt={game.title}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </Link>
                  {game.hasJackpot && (
                    <div className="absolute top-2 right-2 bg-yellow-500 text-gray-900 px-2 py-1 rounded-full text-xs font-bold">
                      💰 Jackpot
                    </div>
                  )}
                  {game.isNew && (
                    <div className="absolute top-2 left-2 bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                      NOUVEAU
                    </div>
                  )}
                </div>

                {}
                <div className="p-4">
                  <Link href={`/games/${game.slug}`}>
                    <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-400 transition-colors">
                      {game.title}
                    </h3>
                  </Link>
                  <p className="text-sm text-gray-400 mb-3">{game.provider === 'pragmatic' || game.provider === 'local' || game.provider === 'slot-pragmatic' ? 'Pragmatic Play' : game.provider}</p>

                  {}
                  <div className="flex gap-2">
                    <Link
                      href={`/games/${game.slug}`}
                      className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 rounded-lg text-center text-sm font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
                    >
                      Jouer
                    </Link>
                    <button
                      onClick={() => handleRemoveFavorite(game._id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                      title="Supprimer des favoris"
                    >
                      ❤️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {}
        {favoriteGames.length > 0 && (
          <div className="mt-12 text-center">
            <Link
              href="/"
              className="inline-block bg-gray-800 hover:bg-gray-700 text-white px-8 py-3 rounded-lg font-semibold transition-all"
            >
              Parcourir plus de jeux
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
