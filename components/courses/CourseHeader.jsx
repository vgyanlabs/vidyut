export default function CourseHeader({ title, description, backgroundImage }) {
  return (
    <section
      className="relative w-full min-h-[280px] md:min-h-[340px] flex flex-col justify-center items-center text-center overflow-hidden"
      style={backgroundImage ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
    >
      <div className={`absolute inset-0 z-0 ${backgroundImage ? 'bg-black/60' : 'bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400'} opacity-90`} />
      <div className="relative z-10 max-w-3xl px-4 py-12 md:py-20">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow mb-4">{title}</h1>
        <p className="text-lg md:text-2xl text-blue-100 font-medium drop-shadow max-w-2xl mx-auto">{description}</p>
      </div>
    </section>
  );
} 