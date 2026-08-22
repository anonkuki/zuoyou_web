export interface DepartmentPhoto {
  src: string;
  alt: string;
  caption: string;
  source: '本部门投稿' | '社团年度记录';
}

const tech = (file: string, alt: string, caption: string): DepartmentPhoto => ({
  src: `/assets/photos/departments/tech/${file}`,
  alt,
  caption,
  source: '本部门投稿',
});

const shared = (file: string, alt: string, caption: string): DepartmentPhoto => ({
  src: `/assets/photos/shared/${file}`,
  alt,
  caption,
  source: '社团年度记录',
});

const department = (folder: string, file: string, alt: string, caption: string): DepartmentPhoto => ({
  src: `/assets/photos/departments/${folder}/${file}`,
  alt,
  caption,
  source: '本部门投稿',
});

export const departmentPhotoLabels: Record<string, { name: string; title: string; intro: string }> = {
  cos: { name: 'COS部', title: '镜头里的角色与伙伴', intro: '从准备到合影，先收录几段属于社团的共同记忆；更多本部门返图会继续补充。' },
  tech: { name: '技术部', title: '取景器后的现场记录', intro: '摄影、直播、后台调控与器材练习，都由这些真实镜头留了下来。' },
  music: { name: '轻音部', title: '排练之外的相聚时刻', intro: '舞台与排练素材仍在整理，先从社团活动和大家相聚的片段开始。' },
  original: { name: '原创部', title: '一起创作的日常', intro: '创作不只发生在画纸上，也发生在围坐讨论、共同完善作品的过程里。' },
  dance: { name: '舞装部', title: '舞台亮起的瞬间', intro: '社庆舞台、户外演出和谢幕合影，记录每一次排练走到聚光灯下。' },
  publicity: { name: '外宣&幻想研', title: '放映、记录与社团现场', intro: '幻想研一起看番与交流作品，外宣把活动现场整理成大家日后还能翻看的记录。' },
};

export const departmentPhotosBySlug: Record<string, DepartmentPhoto[]> = {
  tech: [
    tech('05A52E2C6776BCF896B169F36D51D9EF.jpg', '技术部成员使用稳定器拍摄活动现场', '活动现场的机位准备'),
    tech('0F256EDC9DEA3894BFCD66D6F699B94B.jpg', '技术部成员调整长焦相机', '调整镜头与拍摄参数'),
    tech('1DDC86BB49848C5E66560A3EDA191682.jpg', '手持相机与镜头的器材记录', '外拍设备记录'),
    tech('37413AB610492BA9D93C231451B8FAAE.png', '胶片画面中的春日花影', '胶片里的春日光影'),
    tech('499102A315E640D95E901025F9080DE1.jpg', '技术部活动拍摄间隙的趣味照片', '拍摄间隙，也要留一点快乐'),
    tech('4A048043B0CFFB4FD3FF364DA94CCF50.jpg', '技术部成员在后台电脑前整理素材', '后台剪辑与现场素材整理'),
    tech('571D9F4E47905DF526478FDBAEEED237.jpg', '舞台演出直播调控屏幕', '社庆舞台的直播与后台调控'),
    tech('7EFC72309AC24FC63108AAC7E74128E0.jpg', '落叶上的相机和长焦镜头', '器材与秋日取景'),
    tech('8C820C7109106E0CE0F0464F3CED50EC.jpg', '社团舞台活动结束后的合影', '完成一次活动后的合影'),
    tech('AFAF89DD0D2AABA19B1E214B0DAD826D.jpg', '技术部成员在活动现场操作相机', '活动现场的跟拍时刻'),
    tech('B77E7B6746F5AB925E73A1BBBC7EAA31.jpg', '正在记录舞台画面的摄影机位', '社团活动摄影机位'),
    tech('C709DA8EB01B82142586E6A6E60ED03A.jpg', '技术部成员排成一列进行拍摄练习', '一起练习取景和构图'),
    tech('DB82039A9BA57BF4B734209F259F9C22.jpg', '草地上的相机和镜头', '器材实拍与取景练习'),
    tech('E888B5D09CAA32858FE045E4ED7CD48E.jpg', '从摄影机后方看到的社庆舞台', '镜头后的社庆现场'),
    tech('FAFD2BFA46F10447A854C4996C805206.png', '胶片画面中的花朵与户外景色', '另一卷春日底片'),
  ],
  cos: [
    shared('cosplay-group.jpg', '社团成员身着角色服装的集体合影', '社庆里的角色大合影'),
    shared('indoor-club-group.jpg', '社团成员在室内活动后的合影', '活动结束后一起留下的照片'),
    shared('outdoor-group-night.jpg', '社团成员夜间户外活动合影', '夜色里的社团相聚'),
    shared('anniversary-stage-group.jpg', '社庆舞台上的全体成员合影', '一年一度的社庆大合影'),
  ],
  dance: [
    department('dance', 'dance-01.jpg', '舞装部成员在社庆舞台进行主题合演', '社庆舞台上的主题合演'),
    department('dance', 'dance-02.jpg', '舞装部成员在舞台中央完成整齐编排', '舞台中央，动作正好合拍'),
    department('dance', 'dance-03.jpg', '灯光下的舞装部现场演出剪影', '光棒与节奏一起亮起'),
    department('dance', 'dance-04.jpg', '舞装部夜间主题演出后的合影', '夜色里的主题演出合影'),
    department('dance', 'dance-05.jpg', '舞装部成员在排练场地完整走台', '从排练厅走向正式舞台'),
    department('dance', 'dance-06.jpg', '演出结束后的舞装部成员集体合影', '谢幕后和伙伴们留张合影'),
  ],
  music: [
    shared('club-dinner-pizza.jpg', '社团成员围坐分享披萨', '排练和活动之外的聚餐时间'),
    shared('club-small-group.jpg', '几位社团成员在室内合影', '和熟悉的伙伴一起留下记录'),
    shared('indoor-club-group.jpg', '社团成员室内集体合影', '大家聚在一起的普通一天'),
    shared('anniversary-stage-performance.jpg', '社庆舞台上的现场节目', '从排练室走向社庆舞台'),
  ],
  original: [
    shared('creative-workshop.jpg', '社团成员围在电脑旁讨论创作内容', '围在一起打磨新的想法'),
    shared('creative-workshop-closeup.jpg', '社团成员共同查看桌面上的创作内容', '创作过程中的交流与修改'),
    shared('club-small-group.jpg', '社团成员在室内轻松合影', '完成作品后也要留一张合影'),
    shared('indoor-club-group.jpg', '社团成员参加室内活动的合影', '属于创作者们的社团日常'),
  ],
  publicity: [
    department('publicity-fantasy', 'publicity-01.jpg', '社团成员在图书馆活动后举旗合影', '图书馆活动结束后的合影'),
    department('publicity-fantasy', 'publicity-02.jpg', '社团成员参加大型影院观影活动', '一起走进放映厅看一部作品'),
    department('publicity-fantasy', 'publicity-03.jpg', '社团线下活动成员与社旗合影', '把每次线下相聚认真记录下来'),
    department('publicity-fantasy', 'publicity-04.jpg', '外宣与幻想研成员围桌交流', '围坐聊聊最近喜欢的作品'),
    department('publicity-fantasy', 'publicity-05.jpg', '外宣与幻想研线下交流会现场', '一次轻松的动漫鉴赏交流'),
    department('publicity-fantasy', 'publicity-06.jpg', '社团成员在影院大厅举旗合影', '观影活动开始前的集合'),
    department('publicity-fantasy', 'publicity-07.jpg', '成员通过镜面留下趣味活动合影', '活动记录也可以有一点巧思'),
    department('publicity-fantasy', 'publicity-08.jpg', '社团成员参加主题观影活动', '喜欢同一部作品的人在这里相遇'),
    department('publicity-fantasy', 'publicity-09.jpg', '社团成员在动漫主题展陈前合影', '动漫主题空间里的小聚'),
    department('publicity-fantasy', 'publicity-10.jpg', '幻想研成员在放映厅举旗合影', '幻想研的放映与鉴赏时间'),
    department('publicity-fantasy', 'publicity-11.jpg', '社团大型观影活动入口合影', '人到齐了，准备入场'),
    department('publicity-fantasy', 'publicity-12.jpg', '大型放映厅内的社团观影活动', '和许多同好一起看番的夜晚'),
    department('publicity-fantasy', 'publicity-13.jpg', '幻想研动漫作品分享活动现场', '从观看延伸到分享与讨论'),
    department('publicity-fantasy', 'publicity-14.jpg', '社团成员在图书馆线下活动合影', '外宣镜头里的社团日常'),
  ],
};
