import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import InvestorLayout from '../components/InvestorLayout';
import { fetchPropertyById } from '../api/projects';
import { sanitizeUrl } from '../utils/url';

const ProjectDetailPage = () => {
  const { groupId, projectId } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    fetchPropertyById(projectId)
      .then((response) => {
        if (mounted) {
          setProject(response);
          setActiveImage(0);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.message || 'Unable to load this project right now.');
        }
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, [projectId]);

  if (loading) {
    return (
      <InvestorLayout active="groups">
        <div className="flex min-h-[60vh] items-center justify-center text-slate-600">
          <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-4 shadow-card">
            <span className="h-3 w-3 animate-ping rounded-full bg-primary" />
            Loading project...
          </div>
        </div>
      </InvestorLayout>
    );
  }

  if (error || !project) {
    return (
      <InvestorLayout active="groups">
        <div className="mx-auto w-full max-w-xl rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center shadow-card">
          <p className="text-sm font-semibold text-rose-700">{error || 'Project not found.'}</p>
          <Link to={`/groups/${groupId}`} className="mt-4 inline-block text-sm font-semibold text-primary underline">
            Back to group
          </Link>
        </div>
      </InvestorLayout>
    );
  }

  const gallery = [
    ...(project.featured_image_url ? [{ id: 'featured', image_url: sanitizeUrl(project.featured_image_url) }] : []),
    // The "images" array from the properties endpoint is a plain list of URL
    // strings, not objects — handle both shapes in case that ever changes.
    ...(Array.isArray(project.images)
      ? project.images.map((image, index) => ({
          id: `gallery-${index}`,
          image_url: sanitizeUrl(typeof image === 'string' ? image : image?.image_url || image?.image),
        }))
      : []),
  ];
  const highlights = Array.isArray(project.amenities) ? project.amenities : [];

  return (
    <InvestorLayout active="groups">
      <div className="mx-auto w-full max-w-5xl">
        <Link
          to={`/groups/${groupId}`}
          className="mb-6 inline-flex items-center rounded-pill border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-500 transition duration-150 ease-in-out hover:border-primary hover:text-primary"
        >
          {'<'} Back to group
        </Link>

        {gallery.length > 0 ? (
          <div>
            <div className="h-[28rem] w-full overflow-hidden rounded-3xl bg-slate-100 sm:h-[42rem]">
              <img
                src={gallery[activeImage]?.image_url || gallery[activeImage]?.image}
                alt={project.name}
                className="h-full w-full object-cover"
                onError={(event) => {
                  event.currentTarget.style.display = 'none';
                }}
              />
            </div>
            {gallery.length > 1 ? (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
                {gallery.map((image, index) => (
                  <button
                    key={image.id ?? index}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl border-2 transition ${
                      index === activeImage ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={image.image_url || image.image} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-8 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              {project.group_name || 'Group project'}
            </p>
            <h1 className="mt-1 text-2xl font-semibold text-slate-900 sm:text-3xl">{project.name}</h1>
            {project.location ? <p className="mt-1 text-sm text-slate-500">{project.location}</p> : null}
          </div>
          <span className="w-fit rounded-pill bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
            {project.status || 'In progress'}
          </span>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
            <p className="font-semibold text-slate-900">{project.active_investors || 0} co-investors</p>
            <p>Investors</p>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
            <p className="font-semibold text-slate-900">Undisclosed</p>
            <p>Investment</p>
          </div>
        </div>

        <div className="mt-10 rounded-3xl border border-slate-100 bg-white p-6 shadow-card sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Project detail</p>
          <p className="mt-3 whitespace-pre-line text-sm text-slate-600">
            {project.description || project.summary || 'No description has been provided yet.'}
          </p>

          {highlights.length > 0 ? (
            <div className="mt-8">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">Highlights</p>
              <ul className="mt-3 space-y-2">
                {highlights.map((item, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-slate-600">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </InvestorLayout>
  );
};

export default ProjectDetailPage;
