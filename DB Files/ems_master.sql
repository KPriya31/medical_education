CREATE DATABASE ems_dev;
use ems_dev;

DROP TABLE IF EXISTS tbl_region_master;

CREATE TABLE tbl_region_master (
    region_id INT PRIMARY KEY CHECK (region_id BETWEEN 0 AND 99),
    region_desc VARCHAR(200),
    created_by VARCHAR(50),
    created_date DATETIME,
    updated_by VARCHAR(50),
    updated_date DATETIME,
    status_ BOOLEAN
);

DROP TABLE IF EXISTS tbl_category_master;

CREATE TABLE tbl_category_master (
    cat_id INT PRIMARY KEY CHECK (cat_id BETWEEN 0 AND 99999),
    cat_desc VARCHAR(100),
    created_by VARCHAR(50),
    created_date DATETIME,
    updated_by VARCHAR(50),
    updated_date DATETIME,
    status_ BOOLEAN
);


DROP TABLE IF EXISTS tbl_year_id;

CREATE TABLE tbl_year_id (
    year_id INT PRIMARY KEY CHECK (year_id BETWEEN 0 AND 99),
    year_desc VARCHAR(100),
    created_by VARCHAR(50),
    created_date DATETIME,
    updated_by VARCHAR(50),
    updated_date DATETIME,
    status_ BOOLEAN
);

DROP TABLE IF EXISTS tbl_month_master;

CREATE TABLE tbl_month_master (
    month_id INT PRIMARY KEY CHECK (month_id BETWEEN 0 AND 99),
    month_desc VARCHAR(100),
    created_by VARCHAR(50),
    created_date DATETIME,
    updated_by VARCHAR(50),
    updated_date DATETIME,
    status_ BOOLEAN
);

DROP TABLE IF EXISTS tbl_exam_sem_master;

CREATE TABLE tbl_exam_sem_master (
    sem_id INT PRIMARY KEY CHECK (sem_id BETWEEN 0 AND 99),
    sem_desc VARCHAR(200),
    start_month INT,
    end_month INT,
    created_by VARCHAR(50),
    created_date DATETIME,
    updated_by VARCHAR(50),
    updated_date DATETIME,
    status_ BOOLEAN,

    FOREIGN KEY (start_month) REFERENCES tbl_month_master(month_id),
    FOREIGN KEY (end_month) REFERENCES tbl_month_master(month_id)
);


DROP TABLE IF EXISTS tbl_inst_master;

CREATE TABLE tbl_inst_master (
    inst_id INT PRIMARY KEY CHECK (inst_id BETWEEN 0 AND 99999),
    inst_name VARCHAR(200),
    bome_status INT CHECK (bome_status BETWEEN 0 AND 9),
    boen_status INT CHECK (boen_status BETWEEN 0 AND 9),
    region_id INT,
    cat_id INT,
    created_by VARCHAR(50) ,
    created_date DATETIME,
    updated_by VARCHAR(50),
    updated_date DATETIME,
    status_ BOOLEAN,

    CONSTRAINT fk_inst_region
        FOREIGN KEY (region_id)
        REFERENCES tbl_region_master(region_id),

    CONSTRAINT fk_inst_category
        FOREIGN KEY (cat_id)
        REFERENCES tbl_category_master(cat_id)
);


DROP TABLE IF EXISTS tbl_course_master;

CREATE TABLE tbl_course_master (
    course_id INT PRIMARY KEY CHECK (course_id BETWEEN 0 AND 99999),
    course_desc VARCHAR(200),
    bome_status INT CHECK (bome_status BETWEEN 0 AND 9),
    boen_status INT CHECK (boen_status BETWEEN 0 AND 9),
    created_by VARCHAR(50),
    created_date DATETIME,
    updated_by VARCHAR(50),
    updated_date DATETIME,
    status_ BOOLEAN
);



DROP TABLE IF EXISTS tbl_subject_master;

CREATE TABLE tbl_subject_master (
    subject_id INT PRIMARY KEY CHECK (subject_id BETWEEN 0 AND 9999),
    subject_desc VARCHAR(200),
    bome_status INT CHECK (bome_status BETWEEN 0 AND 9),
    boen_status INT CHECK (boen_status BETWEEN 0 AND 9),
    created_by VARCHAR(50) ,
    created_date DATETIME,
    updated_by VARCHAR(50),
    updated_date DATETIME,
    status_ BOOLEAN
);



DROP TABLE IF EXISTS tbl_inst_course_map;

CREATE TABLE tbl_inst_course_map (
    inst_course_id INT PRIMARY KEY CHECK (inst_course_id BETWEEN 0 AND 9999999999),
    inst_id INT NOT NULL,
    course_id INT NOT NULL,
    created_by VARCHAR(50) ,
    created_date DATETIME,
    updated_by VARCHAR(50),
    updated_date DATETIME,
    status_ BOOLEAN,

    CONSTRAINT fk_inst_course_map_inst
        FOREIGN KEY (inst_id)
        REFERENCES tbl_inst_master(inst_id),

    CONSTRAINT fk_inst_course_map_course
        FOREIGN KEY (course_id)
        REFERENCES tbl_course_master(course_id),

    CONSTRAINT uq_inst_course_map
        UNIQUE (inst_id, course_id)
);


DROP TABLE IF EXISTS tbl_course_subject_map;

CREATE TABLE tbl_course_subject_map (
    course_subject_id INT PRIMARY KEY CHECK (course_subject_id BETWEEN 0 AND 9999999999),
    course_id INT NOT NULL,
    subject_id INT NOT NULL,
    year_id INT NOT NULL,
    sem_id INT NOT NULL,
    priority_id INT,
    created_by VARCHAR(50) DEFAULT 'admin',
    created_date DATETIME,
    updated_by VARCHAR(50),
    updated_date DATETIME,
    status_ BOOLEAN,

    CONSTRAINT fk_course_subject_map_course
        FOREIGN KEY (course_id)
        REFERENCES tbl_course_master(course_id),

    CONSTRAINT fk_course_subject_map_subject
        FOREIGN KEY (subject_id)
        REFERENCES tbl_subject_master(subject_id),

    CONSTRAINT fk_course_subject_map_year
        FOREIGN KEY (year_id)
        REFERENCES tbl_year_id(year_id),

    CONSTRAINT fk_course_subject_map_sem
        FOREIGN KEY (sem_id)
        REFERENCES tbl_exam_sem_master(sem_id),

    CONSTRAINT uq_course_subject_map
        UNIQUE (course_id, subject_id, year_id, sem_id)
);

