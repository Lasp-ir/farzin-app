// backend/routes/courses.js
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// 1️⃣ دریافت لیست تمام دوره‌ها (برای صفحه آموزش و پنل ادمین)
router.get('/', async (req, res) => {
  try {
    const courses = await prisma.course.findMany({
      include: { 
        lessons: true, 
        _count: { select: { enrollments: true, lessons: true } } 
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطا در دریافت اطلاعات دوره‌ها' });
  }
});

// 2️⃣ اضافه کردن دوره جدید (مخصوص پنل ادمین)
router.post('/', async (req, res) => {
  try {
    // 🔥 اضافه شدن description و requirements به دریافت اطلاعات
    const { title, instructor, category, level, duration, image, isPremium, price, description, requirements } = req.body;
    
    const newCourse = await prisma.course.create({
      data: {
        title, 
        instructor, 
        category, 
        level, 
        duration, 
        image: image || 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?q=80&w=400&auto=format&fit=crop', 
        description: description || '',
        requirements: requirements || '',
        isPremium, 
        price: Number(price) || 0
      }
    });
    res.json(newCourse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطا در ایجاد دوره جدید' });
  }
});

// 3️⃣ حذف یک دوره
router.delete('/:id', async (req, res) => {
  try {
    await prisma.course.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'دوره با موفقیت حذف شد' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطا در حذف دوره' });
  }
});
// ==========================================
// 🎥 API های مربوط به جلسات (Lessons)
// ==========================================

// 4️⃣ دریافت تمام جلسات یک دوره خاص
router.get('/:courseId/lessons', async (req, res) => {
  try {
    const lessons = await prisma.lesson.findMany({
      where: { courseId: req.params.courseId },
      orderBy: { order: 'asc' } // مرتب‌سازی بر اساس شماره جلسه
    });
    res.json(lessons);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطا در دریافت جلسات دوره' });
  }
});

// 5️⃣ اضافه کردن جلسه جدید به یک دوره
router.post('/:courseId/lessons', async (req, res) => {
  try {
    const { title, videoUrl, duration, order, isFreePreview } = req.body;
    
    const newLesson = await prisma.lesson.create({
      data: {
        title,
        videoUrl,
        duration,
        order: Number(order),
        isFreePreview: Boolean(isFreePreview),
        courseId: req.params.courseId
      }
    });
    res.json(newLesson);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطا در ثبت جلسه جدید' });
  }
});

// 6️⃣ حذف یک جلسه
router.delete('/lessons/:lessonId', async (req, res) => {
  try {
    await prisma.lesson.delete({
      where: { id: req.params.lessonId }
    });
    res.json({ message: 'جلسه با موفقیت حذف شد' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطا در حذف جلسه' });
  }
});
// ==========================================
// 🛒 API های نمایش و خرید دوره
// ==========================================

// 1. دریافت دیتای پلیر (اصلاح شده)
router.get('/:id/player', async (req, res) => {
  const userId = 1; 
  try {
    const course = await prisma.course.findUnique({
      where: { id: req.params.id },
      include: { lessons: { orderBy: { order: 'asc' } } }
    });

    const enrollment = await prisma.userCourse.findUnique({
      where: { userId_courseId: { userId, courseId: course.id } }
    });

    res.json({
      course,
      isEnrolled: !!enrollment,
      lastLessonId: enrollment?.lastLessonId || null,
      lastTime: enrollment?.lastTime || 0
    });
  } catch (error) { res.status(500).send(error); }
});

// 2. 🔥 API جدید برای ذخیره لحظه‌ای پیشرفت ویدیو
router.post('/save-progress', async (req, res) => {
  const userId = 1;
  const { courseId, lessonId, lastTime, progress } = req.body;
  try {
    await prisma.userCourse.update({
      where: { userId_courseId: { userId, courseId } },
      data: { lastLessonId: lessonId, lastTime: Number(lastTime), progress: Number(progress) }
    });
    res.json({ success: true });
  } catch (error) { res.status(500).send(error); }
});

// 8️⃣ خرید دوره با الماس
router.post('/:id/purchase', async (req, res) => {
  const userId = 1; // موقتاً هاردکد برای تست
  try {
    const course = await prisma.course.findUnique({ where: { id: req.params.id } });
    
    // ۱. ساخت یوزر تستی (فقط برای اینکه الان لاگین نداریم ارور نگیریم)
    let user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      user = await prisma.user.create({
        data: { id: userId, username: 'testuser', email: 'test@test.com', password: '123', gems: 1000 } // ۱۰۰۰ الماس رایگان بهش میدیم!
      });
    }

    if (user.gems < course.price) {
      return res.status(400).json({ error: 'موجودی الماس شما کافی نیست!' });
    }

    // ۲. کسر الماس از یوزر و اضافه کردن دوره به لیستش (تراکنش یکپارچه)
    const transaction = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { gems: user.gems - course.price }
      }),
      prisma.userCourse.create({
        data: { userId, courseId: course.id, progress: 0 }
      })
    ]);

    res.json({ message: 'خرید با موفقیت انجام شد', remainingGems: transaction[0].gems });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطا در پردازش خرید' });
  }
});

// ==========================================
// ♟️ API های مدیریت تمرینات تعاملی (Lichess Style)
// ==========================================

// ۱. دریافت تمام تمرین‌های یک جلسه خاص
router.get('/lessons/:lessonId/exercises', async (req, res) => {
  try {
    const exercises = await prisma.lessonExercise.findMany({
      where: { lessonId: req.params.lessonId },
      orderBy: { order: 'asc' }
    });
    res.json(exercises);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطا در دریافت تمرینات جلسه' });
  }
});

// ۲. ایجاد تمرین جدید برای یک جلسه
router.post('/lessons/:lessonId/exercises', async (req, res) => {
  try {
    const { fen, moves, description, hints, order } = req.body;
    
    const newExercise = await prisma.lessonExercise.create({
      data: {
        fen: fen || 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
        moves, // توالی حرکات مثل: "e2e4 e7e5 g1f3"
        description: description || '',
        hints: typeof hints === 'string' ? hints : JSON.stringify(hints || []), // ذخیره آرایه به صورت رشته JSON
        order: Number(order) || 1,
        lessonId: req.params.lessonId
      }
    });
    res.json(newExercise);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطا در ثبت تمرین جدید' });
  }
});

// ۳. حذف یک تمرین
router.delete('/exercises/:exerciseId', async (req, res) => {
  try {
    await prisma.lessonExercise.delete({
      where: { id: req.params.exerciseId }
    });
    res.json({ message: 'تمرین با موفقیت حذف شد' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطا در حذف تمرین' });
  }
});
// ویرایش اطلاعات یک جلسه
router.put('/lessons/:lessonId', async (req, res) => {
  try {
    const { title, videoUrl, duration, order, isFreePreview } = req.body;
    
    const updatedLesson = await prisma.lesson.update({
      where: { id: req.params.lessonId },
      data: {
        title,
        videoUrl,
        duration,
        order: Number(order),
        isFreePreview: Boolean(isFreePreview)
      }
    });
    res.json(updatedLesson);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطا در ویرایش جلسه' });
  }
});
// ویرایش و آپدیت یک تمرین تعاملی
router.put('/exercises/:exerciseId', async (req, res) => {
  try {
    const { fen, moves, description, order } = req.body;
    
    const updatedExercise = await prisma.lessonExercise.update({
      where: { id: req.params.exerciseId },
      data: {
        fen,
        moves,
        description: description || '',
        order: Number(order) || 1
      }
    });
    res.json(updatedExercise);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطا در ویرایش تمرین' });
  }
});
// ==========================================
// 🎓 API های مدیریت پروفایل اساتید
// ==========================================

// دریافت لیست تمام اساتید
router.get('/instructors/all', async (req, res) => {
  try {
    const instructors = await prisma.instructor.findMany();
    res.json(instructors);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطا در دریافت لیست اساتید' });
  }
});

// ثبت نام استاد جدید
router.post('/instructors/create', async (req, res) => {
  try {
    const { name, title, bio, avatar } = req.body;
    const newInstructor = await prisma.instructor.create({
      data: { 
        name, 
        title: title || 'مدرس فرزین', 
        bio: bio || '', 
        avatar: avatar || 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=150&auto=format&fit=crop' 
      }
    });
    res.json(newInstructor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطا در ساخت پروفایل استاد' });
  }
});
// ویرایش پروفایل استاد
router.put('/instructors/:id', async (req, res) => {
  try {
    const { name, title, bio, avatar } = req.body;
    const updatedInstructor = await prisma.instructor.update({
      where: { id: req.params.id },
      data: { name, title, bio, avatar }
    });
    res.json(updatedInstructor);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'خطا در ویرایش پروفایل استاد' });
  }
});
// 🔥 1. ویرایش اطلاعات یک دوره (برای ادمین)
router.put('/:id', async (req, res) => {
  try {
    const data = req.body;
    // تبدیل مقادیر عددی برای جلوگیری از خطا
    if(data.price) data.price = Number(data.price);
    if(data.discount !== undefined) data.discount = Number(data.discount);
    
    const updatedCourse = await prisma.course.update({
      where: { id: req.params.id },
      data: {
        title: data.title, category: data.category, level: data.level, 
        duration: data.duration, image: data.image, description: data.description, 
        requirements: data.requirements, isPremium: data.isPremium, 
        price: data.price, discount: data.discount
      }
    });
    res.json(updatedCourse);
  } catch (error) { console.error(error); res.status(500).json({ error: 'خطا در ویرایش دوره' }); }
});

// 🔥 2. دریافت پروفایل عمومی استاد همراه با دوره‌هایش (برای کاربر)
router.get('/instructor-profile/:name', async (req, res) => {
  try {
    const instructorName = req.params.name;
    // پیدا کردن اطلاعات استاد
    const instructor = await prisma.instructor.findFirst({ where: { name: instructorName } });
    // پیدا کردن دوره‌های این استاد
    const courses = await prisma.course.findMany({ where: { instructor: instructorName } });
    
    res.json({ instructor, courses });
  } catch (error) { console.error(error); res.status(500).json({ error: 'خطا در دریافت پروفایل استاد' }); }
});
module.exports = router;
