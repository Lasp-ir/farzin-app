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
    const { title, instructor, category, level, duration, image, isPremium, price } = req.body;
    
    const newCourse = await prisma.course.create({
      data: {
        title, 
        instructor, 
        category, 
        level, 
        duration, 
        image: image || 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?q=80&w=400&auto=format&fit=crop', 
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

module.exports = router;
