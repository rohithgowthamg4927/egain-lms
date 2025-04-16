--
-- PostgreSQL database dump
--

-- Dumped from database version 16.8 (Ubuntu 16.8-0ubuntu0.24.10.1)
-- Dumped by pg_dump version 16.8 (Ubuntu 16.8-0ubuntu0.24.10.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: rohith
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO rohith;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: rohith
--

COMMENT ON SCHEMA public IS '';


--
-- Name: Level; Type: TYPE; Schema: public; Owner: rohith
--

CREATE TYPE public."Level" AS ENUM (
    'beginner',
    'intermediate',
    'advanced'
);


ALTER TYPE public."Level" OWNER TO rohith;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: rohith
--

CREATE TYPE public."Role" AS ENUM (
    'admin',
    'instructor',
    'student'
);


ALTER TYPE public."Role" OWNER TO rohith;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: rohith
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO rohith;

--
-- Name: batches; Type: TABLE; Schema: public; Owner: rohith
--

CREATE TABLE public.batches (
    batch_id integer NOT NULL,
    batch_name character varying(255) NOT NULL,
    course_id integer,
    instructor_id integer,
    start_date timestamp(6) with time zone NOT NULL,
    end_date timestamp(6) with time zone NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.batches OWNER TO rohith;

--
-- Name: batches_batch_id_seq; Type: SEQUENCE; Schema: public; Owner: rohith
--

CREATE SEQUENCE public.batches_batch_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.batches_batch_id_seq OWNER TO rohith;

--
-- Name: batches_batch_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: rohith
--

ALTER SEQUENCE public.batches_batch_id_seq OWNED BY public.batches.batch_id;


--
-- Name: course_categories; Type: TABLE; Schema: public; Owner: rohith
--

CREATE TABLE public.course_categories (
    category_id integer NOT NULL,
    category_name character varying(255) NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.course_categories OWNER TO rohith;

--
-- Name: course_categories_category_id_seq; Type: SEQUENCE; Schema: public; Owner: rohith
--

CREATE SEQUENCE public.course_categories_category_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.course_categories_category_id_seq OWNER TO rohith;

--
-- Name: course_categories_category_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: rohith
--

ALTER SEQUENCE public.course_categories_category_id_seq OWNED BY public.course_categories.category_id;


--
-- Name: course_reviews; Type: TABLE; Schema: public; Owner: rohith
--

CREATE TABLE public.course_reviews (
    review_id integer NOT NULL,
    course_id integer,
    user_id integer,
    rating smallint NOT NULL,
    review text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.course_reviews OWNER TO rohith;

--
-- Name: course_reviews_review_id_seq; Type: SEQUENCE; Schema: public; Owner: rohith
--

CREATE SEQUENCE public.course_reviews_review_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.course_reviews_review_id_seq OWNER TO rohith;

--
-- Name: course_reviews_review_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: rohith
--

ALTER SEQUENCE public.course_reviews_review_id_seq OWNED BY public.course_reviews.review_id;


--
-- Name: courses; Type: TABLE; Schema: public; Owner: rohith
--

CREATE TABLE public.courses (
    course_id integer NOT NULL,
    course_name character varying(255) NOT NULL,
    course_level public."Level" NOT NULL,
    category_id integer,
    description text,
    thumbnail_url character varying(255),
    is_published boolean DEFAULT false,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.courses OWNER TO rohith;

--
-- Name: courses_course_id_seq; Type: SEQUENCE; Schema: public; Owner: rohith
--

CREATE SEQUENCE public.courses_course_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.courses_course_id_seq OWNER TO rohith;

--
-- Name: courses_course_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: rohith
--

ALTER SEQUENCE public.courses_course_id_seq OWNED BY public.courses.course_id;


--
-- Name: instructor_courses; Type: TABLE; Schema: public; Owner: rohith
--

CREATE TABLE public.instructor_courses (
    instructor_course_id integer NOT NULL,
    instructor_id integer,
    course_id integer,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.instructor_courses OWNER TO rohith;

--
-- Name: instructor_courses_instructor_course_id_seq; Type: SEQUENCE; Schema: public; Owner: rohith
--

CREATE SEQUENCE public.instructor_courses_instructor_course_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.instructor_courses_instructor_course_id_seq OWNER TO rohith;

--
-- Name: instructor_courses_instructor_course_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: rohith
--

ALTER SEQUENCE public.instructor_courses_instructor_course_id_seq OWNED BY public.instructor_courses.instructor_course_id;


--
-- Name: profile_pictures; Type: TABLE; Schema: public; Owner: rohith
--

CREATE TABLE public.profile_pictures (
    picture_id integer NOT NULL,
    user_id integer,
    file_name character varying(255) NOT NULL,
    file_url character varying(255) NOT NULL,
    file_type character varying(50) NOT NULL,
    file_size integer NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.profile_pictures OWNER TO rohith;

--
-- Name: profile_pictures_picture_id_seq; Type: SEQUENCE; Schema: public; Owner: rohith
--

CREATE SEQUENCE public.profile_pictures_picture_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.profile_pictures_picture_id_seq OWNER TO rohith;

--
-- Name: profile_pictures_picture_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: rohith
--

ALTER SEQUENCE public.profile_pictures_picture_id_seq OWNED BY public.profile_pictures.picture_id;


--
-- Name: resources; Type: TABLE; Schema: public; Owner: rohith
--

CREATE TABLE public.resources (
    resource_id integer NOT NULL,
    title character varying(255) NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    description text,
    file_name character varying(255),
    file_url character varying(255),
    batch_id integer,
    uploaded_by_id integer
);


ALTER TABLE public.resources OWNER TO rohith;

--
-- Name: resources_resource_id_seq; Type: SEQUENCE; Schema: public; Owner: rohith
--

CREATE SEQUENCE public.resources_resource_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.resources_resource_id_seq OWNER TO rohith;

--
-- Name: resources_resource_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: rohith
--

ALTER SEQUENCE public.resources_resource_id_seq OWNED BY public.resources.resource_id;


--
-- Name: schedules; Type: TABLE; Schema: public; Owner: rohith
--

CREATE TABLE public.schedules (
    schedule_id integer NOT NULL,
    batch_id integer,
    start_time time(6) without time zone NOT NULL,
    end_time time(6) without time zone NOT NULL,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    meeting_link text,
    topic text,
    platform text,
    schedule_date timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.schedules OWNER TO rohith;

--
-- Name: schedules_schedule_id_seq; Type: SEQUENCE; Schema: public; Owner: rohith
--

CREATE SEQUENCE public.schedules_schedule_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.schedules_schedule_id_seq OWNER TO rohith;

--
-- Name: schedules_schedule_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: rohith
--

ALTER SEQUENCE public.schedules_schedule_id_seq OWNED BY public.schedules.schedule_id;


--
-- Name: student_batches; Type: TABLE; Schema: public; Owner: rohith
--

CREATE TABLE public.student_batches (
    student_batch_id integer NOT NULL,
    student_id integer,
    batch_id integer,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.student_batches OWNER TO rohith;

--
-- Name: student_batches_student_batch_id_seq; Type: SEQUENCE; Schema: public; Owner: rohith
--

CREATE SEQUENCE public.student_batches_student_batch_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.student_batches_student_batch_id_seq OWNER TO rohith;

--
-- Name: student_batches_student_batch_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: rohith
--

ALTER SEQUENCE public.student_batches_student_batch_id_seq OWNED BY public.student_batches.student_batch_id;


--
-- Name: student_courses; Type: TABLE; Schema: public; Owner: rohith
--

CREATE TABLE public.student_courses (
    student_course_id integer NOT NULL,
    student_id integer,
    course_id integer,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.student_courses OWNER TO rohith;

--
-- Name: student_courses_student_course_id_seq; Type: SEQUENCE; Schema: public; Owner: rohith
--

CREATE SEQUENCE public.student_courses_student_course_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.student_courses_student_course_id_seq OWNER TO rohith;

--
-- Name: student_courses_student_course_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: rohith
--

ALTER SEQUENCE public.student_courses_student_course_id_seq OWNED BY public.student_courses.student_course_id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: rohith
--

CREATE TABLE public.users (
    user_id integer NOT NULL,
    full_name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    phone_number character varying(20),
    role public."Role" NOT NULL,
    password character varying(255) NOT NULL,
    must_reset_password boolean DEFAULT true,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    address text
);


ALTER TABLE public.users OWNER TO rohith;

--
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: public; Owner: rohith
--

CREATE SEQUENCE public.users_user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_user_id_seq OWNER TO rohith;

--
-- Name: users_user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: rohith
--

ALTER SEQUENCE public.users_user_id_seq OWNED BY public.users.user_id;


--
-- Name: batches batch_id; Type: DEFAULT; Schema: public; Owner: rohith
--

ALTER TABLE ONLY public.batches ALTER COLUMN batch_id SET DEFAULT nextval('public.batches_batch_id_seq'::regclass);


--
-- Name: course_categories category_id; Type: DEFAULT; Schema: public; Owner: rohith
--

ALTER TABLE ONLY public.course_categories ALTER COLUMN category_id SET DEFAULT nextval('public.course_categories_category_id_seq'::regclass);


--
-- Name: course_reviews review_id; Type: DEFAULT; Schema: public; Owner: rohith
--

ALTER TABLE ONLY public.course_reviews ALTER COLUMN review_id SET DEFAULT nextval('public.course_reviews_review_id_seq'::regclass);


--
-- Name: courses course_id; Type: DEFAULT; Schema: public; Owner: rohith
--

ALTER TABLE ONLY public.courses ALTER COLUMN course_id SET DEFAULT nextval('public.courses_course_id_seq'::regclass);


--
-- Name: instructor_courses instructor_course_id; Type: DEFAULT; Schema: public; Owner: rohith
--

ALTER TABLE ONLY public.instructor_courses ALTER COLUMN instructor_course_id SET DEFAULT nextval('public.instructor_courses_instructor_course_id_seq'::regclass);


--
-- Name: profile_pictures picture_id; Type: DEFAULT; Schema: public; Owner: rohith
--

ALTER TABLE ONLY public.profile_pictures ALTER COLUMN picture_id SET DEFAULT nextval('public.profile_pictures_picture_id_seq'::regclass);


--
-- Name: resources resource_id; Type: DEFAULT; Schema: public; Owner: rohith
--

ALTER TABLE ONLY public.resources ALTER COLUMN resource_id SET DEFAULT nextval('public.resources_resource_id_seq'::regclass);


--
-- Name: schedules schedule_id; Type: DEFAULT; Schema: public; Owner: rohith
--

ALTER TABLE ONLY public.schedules ALTER COLUMN schedule_id SET DEFAULT nextval('public.schedules_schedule_id_seq'::regclass);


--
-- Name: student_batches student_batch_id; Type: DEFAULT; Schema: public; Owner: rohith
--

ALTER TABLE ONLY public.student_batches ALTER COLUMN student_batch_id SET DEFAULT nextval('public.student_batches_student_batch_id_seq'::regclass);


--
-- Name: student_courses student_course_id; Type: DEFAULT; Schema: public; Owner: rohith
--

ALTER TABLE ONLY public.student_courses ALTER COLUMN student_course_id SET DEFAULT nextval('public.student_courses_student_course_id_seq'::regclass);


--
-- Name: users user_id; Type: DEFAULT; Schema: public; Owner: rohith
--

ALTER TABLE ONLY public.users ALTER COLUMN user_id SET DEFAULT nextval('public.users_user_id_seq'::regclass);


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: rohith
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
\.


--
-- Data for Name: batches; Type: TABLE DATA; Schema: public; Owner: rohith
--

COPY public.batches (batch_id, batch_name, course_id, instructor_id, start_date, end_date, created_at, updated_at) FROM stdin;
1	Batch 1 - CKA	2	2	2025-04-10 05:30:00+05:30	2025-05-10 05:30:00+05:30	2025-04-05 23:44:35.265+05:30	2025-04-05 23:44:35.265+05:30
4	Batch 1 - CCP	1	6	2025-04-20 05:30:00+05:30	2025-04-30 05:30:00+05:30	2025-04-13 00:59:12.246+05:30	2025-04-13 00:59:12.246+05:30
\.


--
-- Data for Name: course_categories; Type: TABLE DATA; Schema: public; Owner: rohith
--

COPY public.course_categories (category_id, category_name, created_at, updated_at) FROM stdin;
1	AWS	2025-04-05 23:30:31.213+05:30	2025-04-05 23:30:31.213+05:30
3	Containers	2025-04-05 23:43:04.37+05:30	2025-04-05 23:43:04.37+05:30
\.


--
-- Data for Name: course_reviews; Type: TABLE DATA; Schema: public; Owner: rohith
--

COPY public.course_reviews (review_id, course_id, user_id, rating, review, created_at, updated_at) FROM stdin;
6	2	3	5	nice	2025-04-14 13:02:42.244+05:30	2025-04-14 13:02:42.245+05:30
\.


--
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: rohith
--

COPY public.courses (course_id, course_name, course_level, category_id, description, thumbnail_url, is_published, created_at, updated_at) FROM stdin;
1	AWS Cloud Practitioner	beginner	1	Ace the CLF C02 exam	\N	t	2025-04-05 23:36:07.202+05:30	2025-04-05 23:36:07.203+05:30
2	Certified Kubernetes Administrator	advanced	3	Ace the CKA exam.	\N	t	2025-04-05 23:42:47.71+05:30	2025-04-05 23:42:47.711+05:30
\.


--
-- Data for Name: instructor_courses; Type: TABLE DATA; Schema: public; Owner: rohith
--

COPY public.instructor_courses (instructor_course_id, instructor_id, course_id, created_at, updated_at) FROM stdin;
1	2	2	2025-04-05 23:44:35.268+05:30	2025-04-05 23:44:35.268+05:30
2	2	1	2025-04-07 07:38:21.246+05:30	2025-04-07 07:38:21.246+05:30
3	6	1	2025-04-08 20:13:52.125+05:30	2025-04-08 20:13:52.125+05:30
4	6	\N	2025-04-09 17:09:42.145+05:30	2025-04-09 17:09:42.145+05:30
5	2	\N	2025-04-09 19:04:57.927+05:30	2025-04-09 19:04:57.927+05:30
\.


--
-- Data for Name: profile_pictures; Type: TABLE DATA; Schema: public; Owner: rohith
--

COPY public.profile_pictures (picture_id, user_id, file_name, file_url, file_type, file_size, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: resources; Type: TABLE DATA; Schema: public; Owner: rohith
--

COPY public.resources (resource_id, title, created_at, updated_at, description, file_name, file_url, batch_id, uploaded_by_id) FROM stdin;
24	IAM, S3 storage lens, S3 CP and Sync	2025-04-13 19:01:08.26+05:30	2025-04-13 19:01:08.26+05:30		IAM, S3 storage lens, S3 CP and Sync.mp4	resources/recordings/batch-1---cka/recordings/IAM, S3 storage lens, S3 CP and Sync.mp4	1	2
25	Forward Chaining and backward chaining in AI	2025-04-13 19:01:37.358+05:30	2025-04-13 19:01:37.358+05:30		Forward Chaining and backward chaining in AI.docx	resources/assignments/batch-1---cka/pdf_files/Forward Chaining and backward chaining in AI.docx	1	2
26	Day2-VPC	2025-04-14 12:57:13.064+05:30	2025-04-14 12:57:13.064+05:30		Day2-VPC.mp4	resources/recordings/batch-1---cka/recordings/Day2-VPC.mp4	1	1
\.


--
-- Data for Name: schedules; Type: TABLE DATA; Schema: public; Owner: rohith
--

COPY public.schedules (schedule_id, batch_id, start_time, end_time, created_at, updated_at, meeting_link, topic, platform, schedule_date) FROM stdin;
14	1	16:00:00	17:30:00	2025-04-13 13:09:19.412+05:30	2025-04-13 13:09:19.412+05:30	https://zoom.com	Containers motivation	Zoom	2025-04-14 00:00:00
\.


--
-- Data for Name: student_batches; Type: TABLE DATA; Schema: public; Owner: rohith
--

COPY public.student_batches (student_batch_id, student_id, batch_id, created_at, updated_at) FROM stdin;
18	3	1	2025-04-13 13:09:38.654+05:30	2025-04-13 13:09:38.654+05:30
21	3	4	2025-04-13 19:26:49.044+05:30	2025-04-13 19:26:49.044+05:30
22	8	1	2025-04-14 12:21:25.259+05:30	2025-04-14 12:21:25.259+05:30
23	8	4	2025-04-14 12:21:34.044+05:30	2025-04-14 12:21:34.044+05:30
\.


--
-- Data for Name: student_courses; Type: TABLE DATA; Schema: public; Owner: rohith
--

COPY public.student_courses (student_course_id, student_id, course_id, created_at, updated_at) FROM stdin;
12	3	2	2025-04-13 13:09:38.656+05:30	2025-04-13 13:09:38.656+05:30
15	3	1	2025-04-13 19:26:49.046+05:30	2025-04-13 19:26:49.046+05:30
16	8	2	2025-04-14 12:21:25.263+05:30	2025-04-14 12:21:25.263+05:30
17	8	1	2025-04-14 12:21:34.046+05:30	2025-04-14 12:21:34.046+05:30
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: rohith
--

COPY public.users (user_id, full_name, email, phone_number, role, password, must_reset_password, created_at, updated_at, address) FROM stdin;
7	Admin 2	admin@gmail.com	\N	admin	Admin@123	f	2025-04-09 19:03:34.496+05:30	2025-04-09 19:06:48.25+05:30	\N
5	Rishi K Nataraja	rishi@gmail.com	6363717245	student	rishi123	f	2025-04-07 07:59:29.504+05:30	2025-04-11 08:49:13.39+05:30	\N
3	Rohith Gowtham G	rohith4927@gmail.com	9663040591	student	bu5i$kFP	t	2025-04-05 23:45:29.689+05:30	2025-04-11 14:41:34.846+05:30	377 6th Main 11th Cross Railway Layout\nBogadi
1	Admin	admin@lms.com	\N	admin	Admin@123	f	2025-04-05 23:28:46.717+05:30	2025-04-08 20:14:58.492+05:30	\N
2	Debajit Chandra	debajit@gmail.com	8792521136	instructor	debajit123	f	2025-04-05 23:43:50.959+05:30	2025-04-13 09:41:09.662+05:30	\N
6	Gurudatta T S	gurudutt@gmail.com	9880393343	instructor	uESNU^7T	t	2025-04-08 20:13:43.52+05:30	2025-04-13 13:03:00.435+05:30	\N
8	Amith Gowtham	kohli123amith@outlook.com	6363717245	student	*6#2bMms	t	2025-04-14 12:20:26.687+05:30	2025-04-14 12:20:26.687+05:30	377 6th Main 11th Cross Railway Layout\nBogadi, Mysore
\.


--
-- Name: batches_batch_id_seq; Type: SEQUENCE SET; Schema: public; Owner: rohith
--

SELECT pg_catalog.setval('public.batches_batch_id_seq', 4, true);


--
-- Name: course_categories_category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: rohith
--

SELECT pg_catalog.setval('public.course_categories_category_id_seq', 7, true);


--
-- Name: course_reviews_review_id_seq; Type: SEQUENCE SET; Schema: public; Owner: rohith
--

SELECT pg_catalog.setval('public.course_reviews_review_id_seq', 6, true);


--
-- Name: courses_course_id_seq; Type: SEQUENCE SET; Schema: public; Owner: rohith
--

SELECT pg_catalog.setval('public.courses_course_id_seq', 6, true);


--
-- Name: instructor_courses_instructor_course_id_seq; Type: SEQUENCE SET; Schema: public; Owner: rohith
--

SELECT pg_catalog.setval('public.instructor_courses_instructor_course_id_seq', 5, true);


--
-- Name: profile_pictures_picture_id_seq; Type: SEQUENCE SET; Schema: public; Owner: rohith
--

SELECT pg_catalog.setval('public.profile_pictures_picture_id_seq', 1, false);


--
-- Name: resources_resource_id_seq; Type: SEQUENCE SET; Schema: public; Owner: rohith
--

SELECT pg_catalog.setval('public.resources_resource_id_seq', 26, true);


--
-- Name: schedules_schedule_id_seq; Type: SEQUENCE SET; Schema: public; Owner: rohith
--

SELECT pg_catalog.setval('public.schedules_schedule_id_seq', 17, true);


--
-- Name: student_batches_student_batch_id_seq; Type: SEQUENCE SET; Schema: public; Owner: rohith
--

SELECT pg_catalog.setval('public.student_batches_student_batch_id_seq', 23, true);


--
-- Name: student_courses_student_course_id_seq; Type: SEQUENCE SET; Schema: public; Owner: rohith
--

SELECT pg_catalog.setval('public.student_courses_student_course_id_seq', 17, true);


--
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: rohith
--

SELECT pg_catalog.setval('public.users_user_id_seq', 8, true);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: rohith
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: batches batches_pkey; Type: CONSTRAINT; Schema: public; Owner: rohith
--

ALTER TABLE ONLY public.batches
    ADD CONSTRAINT batches_pkey PRIMARY KEY (batch_id);


--
-- Name: course_categories course_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: rohith
--

ALTER TABLE ONLY public.course_categories
    ADD CONSTRAINT course_categories_pkey PRIMARY KEY (category_id);


--
-- Name: course_reviews course_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: rohith
--

ALTER TABLE ONLY public.course_reviews
    ADD CONSTRAINT course_reviews_pkey PRIMARY KEY (review_id);


--
-- Name: courses courses_pkey; Type: CONSTRAINT; Schema: public; Owner: rohith
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_pkey PRIMARY KEY (course_id);


--
-- Name: instructor_courses instructor_courses_pkey; Type: CONSTRAINT; Schema: public; Owner: rohith
--

ALTER TABLE ONLY public.instructor_courses
    ADD CONSTRAINT instructor_courses_pkey PRIMARY KEY (instructor_course_id);


--
-- Name: profile_pictures profile_pictures_pkey; Type: CONSTRAINT; Schema: public; Owner: rohith
--

ALTER TABLE ONLY public.profile_pictures
    ADD CONSTRAINT profile_pictures_pkey PRIMARY KEY (picture_id);


--
-- Name: resources resources_pkey; Type: CONSTRAINT; Schema: public; Owner: rohith
--

ALTER TABLE ONLY public.resources
    ADD CONSTRAINT resources_pkey PRIMARY KEY (resource_id);


--
-- Name: schedules schedules_pkey; Type: CONSTRAINT; Schema: public; Owner: rohith
--

ALTER TABLE ONLY public.schedules
    ADD CONSTRAINT schedules_pkey PRIMARY KEY (schedule_id);


--
-- Name: student_batches student_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: rohith
--

ALTER TABLE ONLY public.student_batches
    ADD CONSTRAINT student_batches_pkey PRIMARY KEY (student_batch_id);


--
-- Name: student_courses student_courses_pkey; Type: CONSTRAINT; Schema: public; Owner: rohith
--

ALTER TABLE ONLY public.student_courses
    ADD CONSTRAINT student_courses_pkey PRIMARY KEY (student_course_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: rohith
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- Name: course_reviews_course_id_user_id_key; Type: INDEX; Schema: public; Owner: rohith
--

CREATE UNIQUE INDEX course_reviews_course_id_user_id_key ON public.course_reviews USING btree (course_id, user_id);


--
-- Name: instructor_courses_instructor_id_course_id_key; Type: INDEX; Schema: public; Owner: rohith
--

CREATE UNIQUE INDEX instructor_courses_instructor_id_course_id_key ON public.instructor_courses USING btree (instructor_id, course_id);


--
-- Name: profile_pictures_user_id_key; Type: INDEX; Schema: public; Owner: rohith
--

CREATE UNIQUE INDEX profile_pictures_user_id_key ON public.profile_pictures USING btree (user_id);


--
-- Name: resources_batch_id_idx; Type: INDEX; Schema: public; Owner: rohith
--

CREATE INDEX resources_batch_id_idx ON public.resources USING btree (batch_id);


--
-- Name: resources_uploaded_by_id_idx; Type: INDEX; Schema: public; Owner: rohith
--

CREATE INDEX resources_uploaded_by_id_idx ON public.resources USING btree (uploaded_by_id);


--
-- Name: student_batches_student_id_batch_id_key; Type: INDEX; Schema: public; Owner: rohith
--

CREATE UNIQUE INDEX student_batches_student_id_batch_id_key ON public.student_batches USING btree (student_id, batch_id);


--
-- Name: student_courses_student_id_course_id_key; Type: INDEX; Schema: public; Owner: rohith
--

CREATE UNIQUE INDEX student_courses_student_id_course_id_key ON public.student_courses USING btree (student_id, course_id);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: rohith
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: batches batches_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rohith
--

ALTER TABLE ONLY public.batches
    ADD CONSTRAINT batches_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(course_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: batches batches_instructor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rohith
--

ALTER TABLE ONLY public.batches
    ADD CONSTRAINT batches_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: course_reviews course_reviews_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rohith
--

ALTER TABLE ONLY public.course_reviews
    ADD CONSTRAINT course_reviews_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(course_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: course_reviews course_reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rohith
--

ALTER TABLE ONLY public.course_reviews
    ADD CONSTRAINT course_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: courses courses_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rohith
--

ALTER TABLE ONLY public.courses
    ADD CONSTRAINT courses_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.course_categories(category_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: resources fk_resource_batch; Type: FK CONSTRAINT; Schema: public; Owner: rohith
--

ALTER TABLE ONLY public.resources
    ADD CONSTRAINT fk_resource_batch FOREIGN KEY (batch_id) REFERENCES public.batches(batch_id) ON DELETE CASCADE;


--
-- Name: resources fk_resource_user; Type: FK CONSTRAINT; Schema: public; Owner: rohith
--

ALTER TABLE ONLY public.resources
    ADD CONSTRAINT fk_resource_user FOREIGN KEY (uploaded_by_id) REFERENCES public.users(user_id) ON DELETE CASCADE;


--
-- Name: instructor_courses instructor_courses_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rohith
--

ALTER TABLE ONLY public.instructor_courses
    ADD CONSTRAINT instructor_courses_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(course_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: instructor_courses instructor_courses_instructor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rohith
--

ALTER TABLE ONLY public.instructor_courses
    ADD CONSTRAINT instructor_courses_instructor_id_fkey FOREIGN KEY (instructor_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: profile_pictures profile_pictures_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rohith
--

ALTER TABLE ONLY public.profile_pictures
    ADD CONSTRAINT profile_pictures_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: schedules schedules_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rohith
--

ALTER TABLE ONLY public.schedules
    ADD CONSTRAINT schedules_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.batches(batch_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: student_batches student_batches_batch_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rohith
--

ALTER TABLE ONLY public.student_batches
    ADD CONSTRAINT student_batches_batch_id_fkey FOREIGN KEY (batch_id) REFERENCES public.batches(batch_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: student_batches student_batches_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rohith
--

ALTER TABLE ONLY public.student_batches
    ADD CONSTRAINT student_batches_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: student_courses student_courses_course_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rohith
--

ALTER TABLE ONLY public.student_courses
    ADD CONSTRAINT student_courses_course_id_fkey FOREIGN KEY (course_id) REFERENCES public.courses(course_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: student_courses student_courses_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: rohith
--

ALTER TABLE ONLY public.student_courses
    ADD CONSTRAINT student_courses_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.users(user_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: rohith
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

