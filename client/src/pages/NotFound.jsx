import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="not-found glass">
      <div className="nf-code">404</div>
      <h1>Halaman tidak ditemukan</h1>
      <p className="muted">Halaman yang Anda cari tidak ada atau sudah dipindahkan.</p>
      <Link to="/" className="btn btn-primary">
        Kembali ke Beranda
      </Link>
    </div>
  );
}
