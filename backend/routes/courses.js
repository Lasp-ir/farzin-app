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

module.exports = router;